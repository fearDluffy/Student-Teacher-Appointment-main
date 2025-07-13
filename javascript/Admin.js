import { app } from './firebase-config.js';
import { getAuth, onAuthStateChanged, createUserWithEmailAndPassword } from 'https://www.gstatic.com/firebasejs/10.12.3/firebase-auth.js';
import { getFirestore, doc, getDoc, collection, getDocs, setDoc, deleteDoc } from 'https://www.gstatic.com/firebasejs/10.12.3/firebase-firestore.js';
import { deleteTeacher } from './Authentication.js';

document.addEventListener('DOMContentLoaded', function() {
    const auth = getAuth(app);
    const db = getFirestore(app);
    let initialLoad = true;

    onAuthStateChanged(auth, async (user) => {
        if (user && initialLoad) {
            const userId = user.uid;

            try {
                // Fetch user's custom claims to check their role
                const idTokenResult = await user.getIdTokenResult();
                const userRole = idTokenResult.claims.role;

                if (userRole !== 'Admin') {
                    console.error('User is not an admin');
                    document.getElementById('UserName').textContent = 'Not an admin';
                    return;
                }

                // Fetch and display user's name
                const userDocRef = doc(db, 'admins', userId);
                const userDoc = await getDoc(userDocRef);
                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    document.getElementById('UserName').textContent = userData.name || 'No Name';
                } else {
                    document.getElementById('UserName').textContent = 'No user data found';
                }

                // Retrieve and display all teachers and students
                await updateTable();
                await updatePendingTable();
                await updateStudentsTable();

            } catch (error) {
                console.error('Error getting document for user ID:', userId, 'Error:', error);
                document.getElementById('UserName').textContent = 'Error loading user data';
            } finally {
                initialLoad = false; // Reset flag after the first load
            }
        } else if (!user) {
            window.location.href = '../Index.html';
        }
    });
});

async function updateTable() {
    const auth = getAuth(app);
    const db = getFirestore(app);
    const user = auth.currentUser;

    if (user) {
        try {
            const idTokenResult = await user.getIdTokenResult();
            const role = idTokenResult.claims.role;

            if (role === 'Admin') {
                const teacherCollectionRef = collection(db, 'teachers');
                const teacherSnapshot = await getDocs(teacherCollectionRef);
                const teacherCount = teacherSnapshot.size;
                document.getElementById('TeacherNumber').textContent = teacherCount;

                const teachers = teacherSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                const tableBody = document.getElementById('TeacherTable');
                tableBody.innerHTML = teachers.map((teacher, index) => `
                    <tr>
                        <th scope="row">${index + 1}</th>
                        <td>${teacher.name}</td>
                        <td>${teacher.Email}</td>
                        <td>${teacher.department}</td>
                        <td>${teacher.subject}</td>
                        <td><button class="btn btn-danger btn-sm delete-teacher" data-id="${teacher.id}">Delete</button></td>
                    </tr>
                `).join('');

                // Add event listeners for delete buttons
                document.querySelectorAll('.delete-teacher').forEach(button => {
                    button.addEventListener('click', async () => {
                        const teacherId = button.getAttribute('data-id');
                        await deleteTeacher(teacherId);
                        alert('Teacher deleted successfully!');
                        await updateTable(); // Refresh the table after deletion
                    });
                });
            }
        } catch (error) {
            console.error('Error updating table:', error);
        }
    }
}

async function updatePendingTable() {
    const db = getFirestore(app);
    const pendingStudentsRef = collection(db, 'pendingStudents');
    const pendingStudentsSnapshot = await getDocs(pendingStudentsRef);
    const pendingStudents = pendingStudentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const confirmTableBody = document.getElementById('ConfirmTable');
    confirmTableBody.innerHTML = pendingStudents.map((student, index) => `
        <tr class = "text-center">
            <th scope="row">${index + 1}</th>
            <td>${student.name}</td>
            <td>${student.email}</td>
            <td><button class="btn btn-success btn-sm approve-student" data-id="${student.id}" data-email="${student.email}" data-password="${student.password}">Approve</button></td>
            <td><button class="btn btn-danger btn-sm deny-student" data-id="${student.id}">Deny</button></td>
        </tr>
    `).join('');

    document.querySelectorAll('.approve-student').forEach(button => {
        button.addEventListener('click', async () => {
            const studentId = button.getAttribute('data-id');
            const studentEmail = button.getAttribute('data-email');
            const studentPassword = button.getAttribute('data-password');
            await approveStudent(studentId, studentEmail, studentPassword);
            await updatePendingTable(); // Refresh the table after approval
        });
    });

    document.querySelectorAll('.deny-student').forEach(button => {
        button.addEventListener('click', async () => {
            const studentId = button.getAttribute('data-id');
            await denyStudent(studentId);
            await updatePendingTable(); // Refresh the table after denial
        });
    });
}

async function updateStudentsTable() {
    const auth = getAuth(app);
    const db = getFirestore(app);
    const user = auth.currentUser;

    if (user) {
        try {
            const idTokenResult = await user.getIdTokenResult();
            const role = idTokenResult.claims.role;

            if (role === 'Admin') {
                const studentCollectionRef = collection(db, 'students');
                const studentSnapshot = await getDocs(studentCollectionRef);
                const studentCount = studentSnapshot.size;
                document.getElementById('StudentNumber').textContent = studentCount;

                const students = studentSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                const tableBody = document.getElementById('StudentsTable');
                tableBody.innerHTML = students.map((student, index) => `
                    <tr class = "text-center">
                        <th scope="row">${index + 1}</th>
                        <td>${student.name}</td>
                        <td>${student.email}</td>
                    </tr>
                `).join('');
            }
        } catch (error) {
            console.error('Error updating students table:', error);
        }
    }
}

async function approveStudent(studentId, studentEmail, studentPassword) {
    const auth = getAuth(app);
    const db = getFirestore(app);
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, studentEmail, studentPassword);
        const user = userCredential.user;

        // Add student to Firestore
        await setDoc(doc(db, 'students', user.uid), { name: studentEmail.split('@')[0], email: studentEmail, role: 'Student' });

        // Delete from pendingStudents
        await deleteDoc(doc(db, 'pendingStudents', studentId));

        // Set custom claims for the student
        const idToken = await user.getIdToken();
        await fetch('https://us-central1-student-teacher-appointment001.cloudfunctions.net/setCustomClaims', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${idToken}`
            },
            body: JSON.stringify({ role: 'Student', displayName: user.displayName })
        });

        alert('Student approved successfully!');
        await updateStudentsTable();
        
    } catch (error) {
        console.error('Error approving student:', error);
        alert('Error approving student. Please try again.');
    }
}

async function denyStudent(studentId) {
    const db = getFirestore(app);
    try {
        await deleteDoc(doc(db, 'pendingStudents', studentId));
        alert('Student denied successfully!');
    } catch (error) {
        console.error('Error denying student:', error);
        alert('Error denying student. Please try again.');
    }
}

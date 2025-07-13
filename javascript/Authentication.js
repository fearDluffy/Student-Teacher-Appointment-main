import { app } from './firebase-config.js';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'https://www.gstatic.com/firebasejs/10.12.3/firebase-auth.js';
import { getFirestore, doc, setDoc, collection, getDocs, deleteDoc, getDoc } from 'https://www.gstatic.com/firebasejs/10.12.3/firebase-firestore.js';
import { getFunctions, httpsCallable } from 'https://www.gstatic.com/firebasejs/10.12.3/firebase-functions.js';

document.addEventListener('DOMContentLoaded', function () {
    const auth = getAuth(app);
    const db = getFirestore(app);

    const signInButton = document.getElementById('SignInButton');
    const signUpButton = document.getElementById('SignUpButton');
    const teacherSignUpButton = document.getElementById('TeacherSignUpButton');
    const logoutButton = document.getElementById('logoutButton'); // Add this line

    if (signInButton) {
        signInButton.addEventListener('click', async function (event) {
            event.preventDefault();

            const loginEmail = document.getElementById('SignInEmail').value;
            const loginPassword = document.getElementById('SignInPassword').value;

            let selectedRole = '';
            if (document.getElementById('SignInAdminRadio3').checked) {
                selectedRole = 'Admin';
            } else if (document.getElementById('SignInTeacherRadio1').checked) {
                selectedRole = 'Teacher';
            } else if (document.getElementById('SignInStudentRadio2').checked) {
                selectedRole = 'Student';
            }

            try {
                const userCredential = await signInWithEmailAndPassword(auth, loginEmail, loginPassword);
                const user = userCredential.user;
                const idTokenResult = await user.getIdTokenResult();
                const role = idTokenResult.claims.role;

                if (role === selectedRole) {
                    if (role === 'Admin') {
                        window.location.href = '../html/Admin.html';
                    } else if (role === 'Teacher') {
                        window.location.href = '../html/Teacher.html';
                    } else if (role === 'Student') {
                        window.location.href = '../html/Student.html';
                    }
                } else {
                    alert('Incorrect role selected. Please check your role.');
                }
            } catch (error) {
                console.error('Error signing in:', error.code, error.message);
                handleAuthError(error);
            }
        });
    }

    if (signUpButton) {
        signUpButton.addEventListener('click', async function (event) {
            event.preventDefault();

            const signUpName = document.getElementById('SignUpName').value;
            const signUpEmail = document.getElementById('SignUpWithEmail').value;
            const signUpPassword = document.getElementById('SignUpWithPassword').value;
            const signUpConfirmPassword = document.getElementById('SignUpWithConfirmPassword').value;

            if (signUpPassword !== signUpConfirmPassword) {
                alert('Passwords do not match. Please check your credentials.');
                return;
            }

            let selectedRole = '';
            if (document.getElementById('SignUpAdminRadio2').checked) {
                selectedRole = 'Admin';
            } else if (document.getElementById('SignUpStudentRadio1').checked) {
                selectedRole = 'Student';
            }
            else if (document.getElementById('SignUpTeacherRadio3').checked) {
                selectedRole = 'Teacher';
            }

            if (selectedRole === 'Student') {
                try {
                    await setDoc(doc(db, 'pendingStudents', signUpEmail), {
                        name: signUpName,
                        email: signUpEmail,
                        password: signUpPassword
                    });

                    alert('Sign up request submitted. Awaiting admin approval.');
                } catch (error) {
                    console.error('Error submitting signup request:', error.code, error.message);
                    handleAuthError(error);
                }
            } else {
                try {
                    const userCredential = await createUserWithEmailAndPassword(auth, signUpEmail, signUpPassword);
                    const user = userCredential.user;
                    await setCustomUserClaims(user, selectedRole, signUpName);

                    await setDoc(doc(db, 'admins', user.uid), {
                        name: signUpName,
                        email: signUpEmail,
                        role: selectedRole
                    });

                    alert('Sign up successful!');
                    updateTableAndDisplayName(); // Call without await for immediate feedback
                } catch (error) {
                    console.error('Error signing up:', error.code, error.message);
                    handleAuthError(error);
                }
            }
        });
    }

    if (teacherSignUpButton) {
        teacherSignUpButton.addEventListener('click', async function (event) {
            event.preventDefault();

            const teacherName = document.getElementById('SignUpTeacherName').value;
            const teacherEmail = document.getElementById('SignUpWithTeacherEmail').value;
            const teacherPassword = document.getElementById('SignUpWithTeacherPassword').value;
            const teacherConfirmPassword = document.getElementById('SignUpWithConfirmTeacherPassword').value;
            const department = document.getElementById('DepartmentSelect').value;
            const subject = document.getElementById('SubjectSelect').value;

            if (teacherPassword !== teacherConfirmPassword) {
                alert('Passwords do not match. Please check your credentials.');
                return;
            }

            try {
                const userCredential = await createUserWithEmailAndPassword(auth, teacherEmail, teacherPassword);
                const user = userCredential.user;
                await setCustomUserClaims(user, 'Teacher', teacherName, teacherEmail, department, subject);

                await setDoc(doc(db, 'teachers', user.uid), {
                    name: teacherName,
                    Email: teacherEmail,
                    department,
                    subject,
                    role: 'Teacher'
                });

                alert('Teacher added successfully!');
                updateTableAndDisplayName(); // Call without await for immediate feedback

            } catch (error) {
                console.error('Error adding teacher:', error.code, error.message);
                handleAuthError(error);
            }
        });
    }

    if (logoutButton) {
        logoutButton.addEventListener('click', async function () {
            try {
                await signOut(auth);
                window.location.href = '../Index.html'; // Redirect to Index.html after logout
            } catch (error) {
                console.error('Error signing out:', error.code, error.message);
                // Handle sign out errors if needed
            }
        });
    }
});

async function updateTableAndDisplayName() {
    try {
        const auth = getAuth(app);
        const db = getFirestore(app);
        const user = auth.currentUser;

        if (user) {
            const idTokenResult = await user.getIdTokenResult();
            const role = idTokenResult.claims.role;

            if (role === 'Admin') {
                // Fetch and update data for Admin
                const teacherCollectionRef = collection(db, 'teachers');
                const teacherSnapshot = await getDocs(teacherCollectionRef);
                const teacherCount = teacherSnapshot.size;
                document.getElementById('TeacherNumber').textContent = teacherCount;

                // Retrieve and display all teachers
                const teachers = teacherSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                const tableBody = document.querySelector('tbody');
                tableBody.innerHTML = teachers.map((teacher, index) => `
                    <tr>
                        <th scope="row">${index + 1}</th>
                        <td>${teacher.name}</td>
                        <td>${teacher.Email}</td>
                        <td>${teacher.department}</td>
                        <td>${teacher.subject}</td>
                        <td class="text-center"><button class="btn btn-danger btn-sm delete-teacher" data-id="${teacher.id}">Delete</button></td>
                    </tr>
                `).join('');

                // Update display name
                const userDocRef = doc(db, 'users', user.uid);
                const userDoc = await getDoc(userDocRef);
                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    document.getElementById('UserName').textContent = userData.name || 'No Name';
                } else {
                    document.getElementById('UserName').textContent = 'No user data found';
                }
            }
        }
    } catch (error) {
        console.error('Error updating table and display name:', error);
    }
}

async function setCustomUserClaims(user, role, displayName = null, Email = null, department = null, subject = null) {
    const idToken = await user.getIdToken();
    await fetch('https://us-central1-student-teacher-appointment001.cloudfunctions.net/setCustomClaims', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({ role, displayName, Email, department, subject })
    });
}

function handleAuthError(error) {
    let errorMessage = '';

    switch (error.code) {
        case 'auth/user-not-found':
            errorMessage = 'No user found. Please check your credentials.';
            break;
        case 'auth/email-already-in-use':
            errorMessage = 'Email already in use. Please check your credentials.';
            break;
        case 'auth/invalid-email':
            errorMessage = 'Invalid email. Please check your credentials.';
            break;
        case 'auth/wrong-password':
            errorMessage = 'Incorrect password. Please check your credentials.';
            break;
        case 'auth/network-request-failed':
            errorMessage = 'Network error. Please try again later.';
            break;
        case 'auth/internal-error':
            errorMessage = 'Internal error. Please try again later.';
            break;
        case 'auth/invalid-credential':
            errorMessage = 'Invalid credentials. Please check your credentials.';
            break;
        default:
            errorMessage = 'Error signing in. Please try again later.';
            break;
    }

    alert(errorMessage);
}

export async function deleteTeacher(teacherId) {
    const auth = getAuth(app);
    const functions = getFunctions(app);
    const deleteTeacherFunction = httpsCallable(functions, 'deleteTeacherFromAuth');
    try {
        const result = await deleteTeacherFunction({ teacherId });
        console.log(result.data);
    } catch (error) {
        console.error('Error deleting teacher:', error);
        handleAuthError(error);
    }
}

import { app } from './firebase-config.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.12.3/firebase-auth.js';
import { getFirestore, doc, getDoc, collection, getDocs, setDoc, updateDoc } from 'https://www.gstatic.com/firebasejs/10.12.3/firebase-firestore.js';

const auth = getAuth(app);
const db = getFirestore(app);

// Object to keep track of selected slots for each day
var selectedSlots = {};
var selectedTeacherId = null;
var studentEmail = null;
var selectedClassId = null; // Variable to store selected class ID for messaging

onAuthStateChanged(auth, function (user) {
    if (user) {
        var userId = user.uid;

        (async function () {
            try {
                var idTokenResult = await user.getIdTokenResult();
                var userRole = idTokenResult.claims.role;

                if (userRole !== 'Student') {
                    console.error('User is not a Student');
                    document.getElementById('UserName').textContent = 'Not a Student';
                    return;
                }

                var userDocRef = doc(db, 'students', userId);
                var userDoc = await getDoc(userDocRef);
                if (userDoc.exists()) {
                    var userData = userDoc.data();
                    document.getElementById('UserName').textContent = userData.name || 'No Name';
                    studentEmail = userData.email || 'No Email'; // Store student email

                    // Fetch all teachers and display in the table
                    var teachersSnapshot = await getDocs(collection(db, 'teachers'));
                    var teacherSlots = document.getElementById('TeacherSlots');
                    var counter = 1;

                    teachersSnapshot.forEach((teacherDoc) => {
                        var teacherData = teacherDoc.data();
                        var row = teacherSlots.insertRow();
                        row.innerHTML = `
                            <td>${counter++}</td>
                            <td>${teacherData.name || 'No Name'}</td>
                            <td>${teacherData.department || 'No Department'}</td>
                            <td>${teacherData.subject || 'No Subject'}</td>
                            <td>${teacherData.Email || 'No Email'}</td>
                            <td>
                                <button type="button" class="btn btn-primary btn-sm" data-toggle="modal" data-target="#staticBackdrop" data-teacher-id="${teacherDoc.id}">
                                    Get Appointment
                                </button>
                            </td>
                        `;
                    });

                } else {
                    document.getElementById('UserName').textContent = 'No user data found';
                }

                // Call updateMyClassesTable here to ensure the table is updated when the student logs in
                updateMyClassesTable();

            } catch (error) {
                console.error('Error getting document for user ID:', userId, 'Error:', error);
                document.getElementById('UserName').textContent = 'Error loading user data';
            }
        })();
    } else {
        window.location.href = '../Index.html';
    }
});

// Function to populate the slots table
async function populateSlots(teacherId) {
    var slotsTableBody = document.getElementById('Slots');

    if (!slotsTableBody) {
        console.error('Slots table body element not found');
        return;
    }

    slotsTableBody.innerHTML = ''; // Clear previous slots

    try {
        var teacherDocRef = doc(db, 'teachers', teacherId);
        var teacherDoc = await getDoc(teacherDocRef);

        if (teacherDoc.exists()) {
            var teacherData = teacherDoc.data();
            var slots = teacherData.slots || {}; // Ensure slots field exists
            console.log('Fetched slots:', slots); // Debugging line

            Object.entries(slots).forEach(([day, times]) => {
                var row = slotsTableBody.insertRow();
                var dayCell = row.insertCell(0);
                dayCell.textContent = day;

                times.forEach((time, index) => {
                    var timeCell = row.insertCell(index + 1);
                    
                    // Create a button for each time slot
                    var button = document.createElement('button');
                    button.className = 'btn btn-info btn-sm'; // Add Bootstrap classes for styling
                    button.textContent = time;
                    button.setAttribute('data-time', time);
                    button.setAttribute('data-teacher-id', teacherId);
                    button.setAttribute('data-day', day); // Add day as a data attribute
                    button.addEventListener('click', function () {
                        var selectedDay = button.getAttribute('data-day');
                        var previouslySelectedButton = document.querySelector(`button[data-day="${selectedDay}"].btn-success`);

                        // Deselect previously selected button if it exists
                        if (previouslySelectedButton && previouslySelectedButton !== button) {
                            previouslySelectedButton.classList.remove('btn-success');
                            previouslySelectedButton.classList.add('btn-info');
                            previouslySelectedButton.textContent = previouslySelectedButton.getAttribute('data-time');
                            delete selectedSlots[selectedDay]; // Deselect
                        }

                        // Select the new button
                        if (button.classList.contains('btn-success')) {
                            button.classList.remove('btn-success');
                            button.classList.add('btn-info');
                            button.textContent = time; // Change back to original time text
                            delete selectedSlots[selectedDay]; // Remove selection
                        } else {
                            button.classList.remove('btn-info');
                            button.classList.add('btn-success');
                            selectedSlots[selectedDay] = time; // Save the selected time
                        }

                        console.log('Selected slots:', selectedSlots); // Debugging line
                    });
                    
                    timeCell.appendChild(button);
                });

                // Add empty cells if there are less than 5 slots
                for (var i = times.length; i < 5; i++) {
                    row.insertCell(i + 1); // Empty cell
                }
            });

            // Handle previously selected slots
            Object.entries(selectedSlots).forEach(([day, time]) => {
                var button = document.querySelector(`button[data-day="${day}"][data-time="${time}"]`);
                if (button) {
                    button.classList.remove('btn-info');
                    button.classList.add('btn-success');
                }
            });

        } else {
            console.error('No such teacher!');
        }
    } catch (error) {
        console.error('Error getting teacher slots:', error);
    }
}

async function updateMyClassesTable() {
    const user = auth.currentUser;

    if (user) {
        const userId = user.uid;
        const studentDocRef = doc(db, 'students', userId);

        try {
            const docSnap = await getDoc(studentDocRef);
            if (docSnap.exists()) {
                const studentData = docSnap.data();
                const myClasses = studentData.myClasses || [];
                const tableBody = document.getElementById('MyClasses');
                tableBody.innerHTML = ""; // Clear existing table rows

                console.log('Fetched classes:', myClasses); // Debugging line

                myClasses.forEach((myClass, index) => {
                    const row = tableBody.insertRow();
                    row.innerHTML = `
                        <td>${index + 1}</td>
                        <td>${myClass.teacherName}</td>
                        <td>${myClass.department}</td>
                        <td>${myClass.subject}</td>
                        <td>${myClass.email}</td>
                        <td>${myClass.day}</td>
                        <td>${myClass.time}</td>
                        <td><button type="button" class="btn btn-primary btn-sm" data-toggle="modal" data-target="#staticBackdrop1" data-class-id="123456">Message</button></td>
                    `;
                });

                console.log('Table updated successfully'); // Debugging line
            } else {
                console.error('No document found for the user.');
            }
        } catch (error) {
            console.error('Error getting document:', error);
        }
    } 
}

// Call this function once the student view is initialized
updateMyClassesTable();

// Add event listener to handle modal opening and data fetching
$('#staticBackdrop').on('show.bs.modal', function (event) {
    var button = $(event.relatedTarget); // Button that triggered the modal
    selectedTeacherId = button.data('teacher-id'); // Store the selected teacher ID

    // Populate the slots when the modal is shown
    populateSlots(selectedTeacherId);
});

// Add event listener for the ConfirmButton
document.getElementById('ConfirmButton').addEventListener('click', async function () {
    if (!selectedTeacherId) {
        console.error('No teacher selected.');
        return;
    }

    if (Object.keys(selectedSlots).length === 0) {
        console.error('No slot selected.');
        return;
    }

    var user = getAuth().currentUser;
    if (!user) {
        console.error('No user is currently authenticated.');
        return;
    }

    try {
        var userId = user.uid;
        var teacherDocRef = doc(db, 'teachers', selectedTeacherId);
        var teacherDoc = await getDoc(teacherDocRef);
        var studentDocRef = doc(db, 'students', userId);
        var studentDoc = await getDoc(studentDocRef);

        if (teacherDoc.exists()) {
            var teacherData = teacherDoc.data();
            var appointments = teacherData.appointments || {};
            var studentName = studentDoc.exists() ? studentDoc.data().name || 'Unknown Student' : 'Unknown Student';

            // Add the new appointment to the teacher's appointments collection
            for (var day in selectedSlots) {
                var time = selectedSlots[day];
                appointments[day] = appointments[day] || [];
                appointments[day].push({
                    studentName: studentName,
                    studentEmail: studentEmail, // Add student email to the appointment
                    time: time,
                    status: 'Pending'
                });
            }

            await updateDoc(teacherDocRef, { appointments: appointments });

            // Optionally, you might want to clear the selected slots and close the modal
            selectedSlots = {};
            $('#staticBackdrop').modal('hide');
            alert('Appointment successfully created.');
            console.log('Appointment successfully created.');

            // Update the MyClasses table after an appointment is created
            updateMyClassesTable();
        } else {
            console.error('No such teacher!');
        }
    } catch (error) {
        console.error('Error creating appointment:', error);
    }
});

// Ensure your modal event listener is correctly set up
$('#staticBackdrop1').on('show.bs.modal', function (event) {
    var button = $(event.relatedTarget);
    selectedClassId = button.data('class-id');
    console.log('Selected class ID:', selectedClassId); // Debugging line
});

// Wait until the DOM is fully loaded before executing the script
document.addEventListener('DOMContentLoaded', function() {
    var messageInput = document.getElementById('Message');
    var submitButton = document.getElementById('sendButton');

    // Check if the elements exist
    if (!messageInput) {
        console.error('Message input element not found');
        return;
    }

    if (!submitButton) {
        console.error('Submit button element not found');
        return;
    }

    submitButton.addEventListener('click', async function() {
        // Get the raw value from the message input
        var rawValue = messageInput.value;
        console.log('Raw message input value:', rawValue); // Debugging line

        // Check if the raw value is empty
        if (rawValue === '') {
            // Display an error message to the user
            alert("Please enter a message.");
            return;
        }

        // Trim whitespace from the input value
        var messageText = rawValue.trim();
        console.log('Trimmed message text:', messageText); // Debugging line

        // Check if the trimmed message text is empty
        if (messageText.length === 0) {
            // Display an error message to the user
            alert("Please enter a message with actual text.");
            return;
        }

        // Proceed with sending the message
        try {
            var user = getAuth().currentUser;
            if (!user) {
                console.error('No user is signed in.');
                return;
            }

            var userId = user.uid;
            var studentDocRef = doc(db, 'students', userId);
            var studentDoc = await getDoc(studentDocRef);

            if (studentDoc.exists()) {
                var studentData = studentDoc.data();
                var messageRef = doc(db, 'messages', selectedClassId); // Ensure selectedClassId is properly set
                await setDoc(messageRef, {
                    sender: studentData.name,
                    email: studentData.email,
                    message: messageText,
                    timestamp: new Date()
                });

                // Close the modal and reset input
                $('#staticBackdrop1').modal('hide');
                messageInput.value = '';
                selectedClassId = null; // Reset selected class ID
            } else {
                console.error('Student document does not exist.');
            }
        } catch (error) {
            console.error('Error sending message:', error);
        }
    });
});


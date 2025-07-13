import { app } from './firebase-config.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.12.3/firebase-auth.js';
import { getFirestore, doc, getDoc, getDocs, query, collection, where, setDoc } from 'https://www.gstatic.com/firebasejs/10.12.3/firebase-firestore.js';

document.addEventListener('DOMContentLoaded', function () {
    var daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    var selectedSlots = [];
    var selectedDay = "";

    function startTime() {
        var today = new Date();
        var h = today.getHours();
        var m = today.getMinutes();
        var s = today.getSeconds();
        var day = today.getDay();
        var date = today.getDate();
        var month = today.getMonth() + 1; // Months are zero-based
        var year = today.getFullYear();

        document.getElementById('CurrentStatus').innerHTML = daysOfWeek[day] + ", " + date + "-" + month + "-" + year + " " + h + ":" + m + ":" + s;
        setTimeout(startTime, 1000);
    }

    function handleSlotClick(event) {
        var button = event.target;
        if (button.classList.contains('slot-btn') && !button.classList.contains('disabled')) {
            var slotTime = button.textContent.trim();

            if (selectedSlots.includes(slotTime)) {
                button.classList.remove('btn-primary');
                button.classList.add('btn-outline-primary');
                selectedSlots = selectedSlots.filter(function (item) {
                    return item !== slotTime;
                });
            } else {
                button.classList.remove('btn-outline-primary');
                button.classList.add('btn-primary');
                selectedSlots.push(slotTime);
            }
        }
    }

    function attachEventListeners() {
        var slots = document.querySelectorAll('.slot-btn');
        slots.forEach(function (slot) {
            slot.addEventListener('click', handleSlotClick);
        });

        var submitButton = document.getElementById('SubmitSlots');
        if (submitButton) {
            submitButton.addEventListener('click', handleSubmit);
        }
    }

    function updateSelectedSlotsTable(slots) {
        var tableBody = document.getElementById('SelectedSlots');
        tableBody.innerHTML = ""; // Clear existing table rows

        var serialNumber = 1; // Initialize serial number

        // Show all slots for all days
        daysOfWeek.forEach(function (day) {
            var daySlots = slots[day] || [];
            daySlots.forEach(function (slot) {
                var row = document.createElement('tr');
                row.innerHTML =
                    `<td>${serialNumber++}</td>` + // Increment serial number
                    `<td>${day}</td>` +
                    `<td>${slot}</td>` +
                    `<td><button class="btn btn-danger btn-sm remove-slot" data-slot="${slot}" data-day="${day}">Remove</button></td>`;
                tableBody.appendChild(row);
            });
        });

        // Add event listeners for remove buttons
        var removeButtons = document.querySelectorAll('.remove-slot');
        removeButtons.forEach(function (button) {
            button.addEventListener('click', function () {
                var slotToRemove = button.getAttribute('data-slot');
                var dayToRemoveFrom = button.getAttribute('data-day');

                selectedSlots = selectedSlots.filter(function (slot) {
                    return slot !== slotToRemove;
                });

                // Update the Firestore to remove the slot
                var auth = getAuth(app);
                var db = getFirestore(app);
                var user = auth.currentUser;

                if (user) {
                    var userId = user.uid;
                    var userDocRef = doc(db, 'teachers', userId);

                    getDoc(userDocRef).then(function (docSnap) {
                        if (docSnap.exists()) {
                            var existingData = docSnap.data();
                            var existingSlots = existingData.slots || {};

                            // Remove the slot for the specific day
                            if (existingSlots[dayToRemoveFrom]) {
                                existingSlots[dayToRemoveFrom] = existingSlots[dayToRemoveFrom].filter(function (slot) {
                                    return slot !== slotToRemove;
                                });

                                // Update the document
                                setDoc(userDocRef, {
                                    slots: existingSlots
                                }, { merge: true }).then(function () {
                                    alert('Slot removed successfully.');
                                    updateSlotsTable(userDocRef); // Update the table after removing the slot
                                }).catch(function (error) {
                                    console.error('Error updating slots:', error);
                                    alert('Error removing slot.');
                                });
                            }
                        }
                    }).catch(function (error) {
                        console.error('Error getting document:', error);
                    });
                }
            });
        });
    }

    function handleSubmit() {
        var daySelect = document.getElementById('DaySelect');
        selectedDay = daySelect.value;

        if (selectedDay === "" || selectedSlots.length === 0) {
            alert('Please select a day and at least one time slot.');
            return;
        }

        var auth = getAuth(app);
        var db = getFirestore(app);
        var user = auth.currentUser;

        if (user) {
            var userId = user.uid;
            var userDocRef = doc(db, 'teachers', userId);

            // Fetch existing slots data
            getDoc(userDocRef).then(function (docSnap) {
                if (docSnap.exists()) {
                    var existingData = docSnap.data();
                    var existingSlots = existingData.slots || {};

                    // Update the slots for the selected day
                    existingSlots[selectedDay] = selectedSlots;

                    // Update the document
                    setDoc(userDocRef, {
                        slots: existingSlots
                    }, { merge: true }).then(function () {
                        alert('Slots updated successfully.');
                        // Reload and update the slots in the table
                        updateSlotsTable(userDocRef);
                    }).catch(function (error) {
                        console.error('Error updating slots:', error);
                        alert('Error updating slots.');
                    });
                } else {
                    console.error('No document found for the user.');
                    alert('Error: No document found.');
                }
            }).catch(function (error) {
                console.error('Error getting document:', error);
                alert('Error fetching existing slots.');
            });
        } else {
            console.error('No user is signed in.');
            alert('Please sign in to submit slots.');
        }
    }

    function updateSlotsTable(userDocRef) {
        getDoc(userDocRef).then(function (docSnap) {
            if (docSnap.exists()) {
                var userData = docSnap.data();
                var slots = userData.slots || {};
                updateSelectedSlotsTable(slots); // Update the table with all slots
                // Update button states to reflect the current selection
                var slotButtons = document.querySelectorAll('.slot-btn');
                slotButtons.forEach(function (button) {
                    var slotTime = button.textContent.trim();
                    if (selectedSlots.includes(slotTime)) {
                        button.classList.remove('btn-outline-primary');
                        button.classList.add('btn-primary');
                    } else {
                        button.classList.remove('btn-primary');
                        button.classList.add('btn-outline-primary');
                    }
                });
            } else {
                console.error('No document found for the user.');
            }
        }).catch(function (error) {
            console.error('Error getting document:', error);
        });
    }

    function fetchPendingAppointments() {
        var auth = getAuth(app);
        var db = getFirestore(app);
        var user = auth.currentUser;

        if (user) {
            var userId = user.uid;
            var userDocRef = doc(db, 'teachers', userId);

            // Fetch pending appointments
            getDoc(userDocRef).then(function (docSnap) {
                if (docSnap.exists()) {
                    var userData = docSnap.data();
                    var appointments = userData.appointments || {};
                    displayPendingAppointments(appointments);
                } else {
                    console.error('No document found for the user.');
                }
            }).catch(function (error) {
                console.error('Error getting document:', error);
            });
        } else {
            console.error('No user is signed in.');
        }
    }

    function displayPendingAppointments(appointments) {
        var tableBody = document.getElementById('PendingAppointments');
        tableBody.innerHTML = ""; // Clear existing table rows

        var IndexNumber = 1; // Initialize serial number

        for (var day in appointments) {
            var dayAppointments = appointments[day];
            dayAppointments.forEach(function (appointment, index) {
                var row = document.createElement('tr');
                row.innerHTML =
                    `<td>${IndexNumber++}</td>` + // Increment serial number
                    `<td>${appointment.studentName}</td>` +
                    `<td>${appointment.studentEmail}</td>` +
                    `<td>${day}</td>` +
                    `<td>${appointment.time}</td>` +
                    `<td><button class="btn btn-success btn-sm accept-btn" data-studentname="${appointment.studentName}" data-studentemail="${appointment.studentEmail}" data-day="${day}" data-time="${appointment.time}">Accept</button></td>` +
                    `<td><button class="btn btn-danger btn-sm reject-btn" data-day="${day}" data-time="${appointment.time}">Reject</button></td>`;
                tableBody.appendChild(row);
            });
        }

        // Add event listeners for accept buttons
        var acceptButtons = document.querySelectorAll('.accept-btn');
        acceptButtons.forEach(function (button) {
            button.addEventListener('click', function () {
                var studentName = button.getAttribute('data-studentname');
                var studentEmail = button.getAttribute('data-studentemail');
                var day = button.getAttribute('data-day');
                var time = button.getAttribute('data-time');
                handleAccept(day, time, studentName, studentEmail);
            });
        });

        var rejectButtons = document.querySelectorAll('.reject-btn');
        rejectButtons.forEach(function (button) {
            button.addEventListener('click', function () {
                var day = button.getAttribute('data-day');
                var time = button.getAttribute('data-time');
                handleReject(day, time);
            });
        });
    }

    async function handleAccept(day, time, studentName, studentEmail) {
        var auth = getAuth(app);
        var db = getFirestore(app);
        var user = auth.currentUser;
    
        if (user) {
            var userId = user.uid;
            var userDocRef = doc(db, 'teachers', userId);
    
            try {
                var docSnap = await getDoc(userDocRef);
                if (docSnap.exists()) {
                    var existingData = docSnap.data();
                    var appointments = existingData.appointments || {};
                    var slots = existingData.slots || {};
                    var myAppointments = existingData.myAppointments || [];
                    var Email = existingData.Email;
    
                    // Remove appointment from pending
                    if (appointments[day]) {
                        appointments[day] = appointments[day].filter(app => app.time !== time);
                    }
    
                    // Add appointment to my appointments
                    myAppointments.push({
                        studentName: studentName,
                        studentEmail: studentEmail,
                        day: day,
                        time: time
                    });
    
                    // Update the teacher's document
                    await setDoc(userDocRef, {
                        appointments: appointments,
                        slots: slots,
                        myAppointments: myAppointments
                    }, { merge: true });
    
                    // Fetch the student user ID using their email (assuming there is a students collection that maps email to userId)
                    var studentQuery = await getDocs(query(collection(db, 'students'), where('email', '==', studentEmail)));
                    if (!studentQuery.empty) {
                        var studentDoc = studentQuery.docs[0];
                        var studentUserId = studentDoc.id; // Get the student user ID
    
                        // Update the student's document
                        var studentDocRef = doc(db, 'students', studentUserId);
                        var studentDocSnap = await getDoc(studentDocRef);
    
                        var studentData = studentDocSnap.exists() ? studentDocSnap.data() : {};
                        var myClasses = studentData.myClasses || [];
    
                        myClasses.push({
                            teacherName: existingData.name || 'Unknown Teacher',
                            department: existingData.department || 'Unknown Department',
                            subject: existingData.subject || 'Unknown Subject',
                            email: Email || 'No Email',
                            day: day,
                            time: time
                        });
    
                        await setDoc(studentDocRef, {
                            myClasses: myClasses
                        }, { merge: true });
    
                        alert('Appointment accepted successfully.');
                        updateSlotsTable(userDocRef); // Update the slots table
                        fetchPendingAppointments(); // Refresh pending appointments
                        updateMyAppointmentsTable(); // Update My Appointments table
                    } else {
                        console.error('No student found with the provided email.');
                        alert('Error: No student found.');
                    }
                }
            } catch (error) {
                console.error('Error updating slots and appointments:', error);
                alert('Error accepting appointment.');
            }
        } else {
            console.error('No user is signed in.');
        }
    }
    
    async function handleCompleted(day, time, studentEmail) {
        var auth = getAuth(app);
        var db = getFirestore(app);
        var user = auth.currentUser;
    
        if (user) {
            var userId = user.uid;
            var userDocRef = doc(db, 'teachers', userId);
    
            try {
                var docSnap = await getDoc(userDocRef);
                if (docSnap.exists()) {
                    var existingData = docSnap.data();
                    var myAppointments = existingData.myAppointments || [];
    
                    // Remove completed appointment
                    myAppointments = myAppointments.filter(function (app) {
                        return !(app.day === day && app.time === time);
                    });
    
                    // Update the teacher's document
                    await setDoc(userDocRef, {
                        myAppointments: myAppointments
                    }, { merge: true });
    
                    // Fetch the student user ID using their email (assuming there is a students collection that maps email to userId)
                    var studentQuery = await getDocs(query(collection(db, 'students'), where('email', '==', studentEmail)));
                    if (!studentQuery.empty) {
                        var studentDoc = studentQuery.docs[0];
                        var studentUserId = studentDoc.id; // Get the student user ID
    
                        // Update the student's document
                        var studentDocRef = doc(db, 'students', studentUserId);
                        var studentDocSnap = await getDoc(studentDocRef);
    
                        var studentData = studentDocSnap.exists() ? studentDocSnap.data() : {};
                        var myClasses = studentData.myClasses || [];
    
                        // Remove the completed class from the student's myClasses array
                        myClasses = myClasses.filter(function (cls) {
                            return !(cls.day === day && cls.time === time);
                        });
    
                        await setDoc(studentDocRef, {
                            myClasses: myClasses
                        }, { merge: true });
    
                        alert('Completed Appointment deleted successfully.');
                        updateMyAppointmentsTable(); // Refresh the My Appointments table
                    } else {
                        console.error('No student found with the provided email.');
                        alert('Error: No student found.');
                    }
                } else {
                    console.error('No document found for the user.');
                }
            } catch (error) {
                console.error('Error updating appointments:', error);
                alert('Error deleting completed appointment.');
            }
        } else {
            console.error('No user is signed in.');
        }
    }    

    function updateMyAppointmentsTable() {
        var auth = getAuth(app);
        var db = getFirestore(app);
        var user = auth.currentUser;
    
        if (user) {
            var userId = user.uid;
            var userDocRef = doc(db, 'teachers', userId);
    
            getDoc(userDocRef).then(function (docSnap) {
                if (docSnap.exists()) {
                    var userData = docSnap.data();
                    var myAppointments = userData.myAppointments || [];
                    var tableBody = document.getElementById('MyAppointments');
                    tableBody.innerHTML = ""; // Clear existing table rows
    
                    var serialNumber = 1;
    
                    myAppointments.forEach(function (appointment) {
                        var row = document.createElement('tr');
                        row.innerHTML =
                            `<td>${serialNumber++}</td>` +
                            `<td>${appointment.studentName}</td>` +
                            `<td>${appointment.studentEmail}</td>` +
                            `<td>${appointment.day}</td>` +
                            `<td>${appointment.time}</td>` +
                            `<td><button class="btn btn-success btn-sm completed-btn" data-day="${appointment.day}" data-time="${appointment.time}" data-studentemail="${appointment.studentEmail}">Completed</button></td>`;
                        tableBody.appendChild(row);
                    });
    
                    // Add event listeners for completed buttons
                    var completedButtons = document.querySelectorAll('.completed-btn');
                    completedButtons.forEach(function (button) {
                        button.addEventListener('click', function () {
                            var day = button.getAttribute('data-day');
                            var time = button.getAttribute('data-time');
                            var studentEmail = button.getAttribute('data-studentemail'); // Retrieve student email from the button
                            handleCompleted(day, time, studentEmail); // Pass the student email to handleCompleted function
                        });
                    });
                } else {
                    console.error('No document found for the user.');
                }
            }).catch(function (error) {
                console.error('Error getting document:', error);
            });
        } else {
            console.error('No user is signed in.');
        }
    }

    function handleReject(day, time) {
        var auth = getAuth(app);
        var db = getFirestore(app);
        var user = auth.currentUser;

        if (user) {
            var userId = user.uid;
            var userDocRef = doc(db, 'teachers', userId);

            // Remove the rejected appointment from the database
            if (user) {
                getDoc(userDocRef).then(function (docSnap) {
                    if (docSnap.exists()) {
                        var existingData = docSnap.data();
                        var appointments = existingData.appointments || {};

                        // Remove appointment from pending
                        if (appointments[day]) {
                            appointments[day] = appointments[day].filter(function (app) {
                                return app.time !== time;
                            });

                            // Update the document
                            setDoc(userDocRef, {
                                appointments: appointments
                            }, { merge: true }).then(function () {
                                alert('Appointment rejected successfully.');
                                fetchPendingAppointments(); // Refresh pending appointments
                            }).catch(function (error) {
                                console.error('Error updating appointments:', error);
                                alert('Error rejecting appointment.');
                            });
                        }
                    }
                }).catch(function (error) {
                    console.error('Error getting document:', error);
                });
            } else {
                console.error('No user is signed in.');
            }
        }
    }

    function initializePage() {
        startTime();
        attachEventListeners();
    }

    var auth = getAuth(app);
    var db = getFirestore(app);
    var initialLoad = true;

    onAuthStateChanged(auth, function (user) {
        if (user && initialLoad) {
            var userId = user.uid;

            (async function () {
                try {
                    var idTokenResult = await user.getIdTokenResult();
                    var userRole = idTokenResult.claims.role;

                    if (userRole !== 'Teacher') {
                        console.error('User is not a Teacher');
                        document.getElementById('UserName').textContent = 'Not a Teacher';
                        return;
                    }

                    var userDocRef = doc(db, 'teachers', userId);
                    var userDoc = await getDoc(userDocRef);
                    if (userDoc.exists()) {
                        var userData = userDoc.data();
                        document.getElementById('UserName').textContent = userData.name || 'No Name';

                        // Load and display existing slots
                        var slots = userData.slots || {};
                        updateSlotsTable(userDocRef); // Initialize with existing data

                        // Fetch and display pending appointments
                        fetchPendingAppointments();
                        updateMyAppointmentsTable(); // Update My Appointments table
                    } else {
                        document.getElementById('UserName').textContent = 'No user data found';
                    }
                } catch (error) {
                    console.error('Error getting document for user ID:', userId, 'Error:', error);
                    document.getElementById('UserName').textContent = 'Error loading user data';
                } finally {
                    initialLoad = false; // Reset flag after the first load
                    initializePage(); // Initialize the page only once the user is authenticated
                }
            })();
        } else if (!user) {
            window.location.href = '../Index.html';
        }
    });
});

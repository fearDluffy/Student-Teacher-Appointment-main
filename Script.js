console.log("Script.js loaded");
// Purpose: To toggle the password visibility of Password in the Sign-Up page
const SignUpPasswordInput = document.getElementById('SignUpWithPassword');
const SignUpToggleButton = document.getElementById('ToggleSignUpPassword');

// function to toggle the password visibility
function toggleSignUpPassword() {
    if (SignUpPasswordInput.type === 'password') {
        SignUpPasswordInput.type = 'text';
        SignUpToggleButton.innerHTML = '<i class="fa-solid fa-eye-slash"></i>';
    }
    else {
        SignUpPasswordInput.type = 'password';
        SignUpToggleButton.innerHTML = '<i class="fa-solid fa-eye"></i>';
    }
}

function getQueryParameter(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
}

document.addEventListener('DOMContentLoaded', function () {
    const role = getQueryParameter('role');
    if (role) {
        const radioButtonId = `SignIn${role}Radio${role === 'Teacher' ? '1' : role === 'Student' ? '2' : '3'}`;
        const radioButton = document.getElementById(radioButtonId);
        if (radioButton) {
            radioButton.checked = true;
        }
    }
});

// Purpose: To toggle the password visibility of Confirm Password in the Sign-Up page
const SignUpConfirmPasswordInput = document.getElementById('SignUpWithConfirmPassword');
const SignUpConfirmToggleButton = document.getElementById('ToggleSignUpConfirmPassword');

// function to toggle the password visibility
function toggleSignUpConfirmPassword() {
    if (SignUpConfirmPasswordInput.type === 'password') {
        SignUpConfirmPasswordInput.type = 'text';
        SignUpConfirmToggleButton.innerHTML = '<i class="fa-solid fa-eye-slash"></i>';
    }
    else {
        SignUpConfirmPasswordInput.type = 'password';
        SignUpConfirmToggleButton.innerHTML = '<i class="fa-solid fa-eye"></i>';
    }
}

// Purpose: To toggle the password visibility of Password in the Teacher Sign-Up page
const TeacherSignUpPasswordInput = document.getElementById('SignUpWithTeacherPassword');
const TeacherSignUpToggleButton = document.getElementById('ToggleSignUpTeacherPassword');

// function to toggle the password visibility
function toggleSignUpTeacherPassword() {
    if (TeacherSignUpPasswordInput.type === 'password') {
        TeacherSignUpPasswordInput.type = 'text';
        TeacherSignUpToggleButton.innerHTML = '<i class="fa-solid fa-eye-slash"></i>';
    }
    else {
        TeacherSignUpPasswordInput.type = 'password';
        TeacherSignUpToggleButton.innerHTML = '<i class="fa-solid fa-eye"></i>';
    }
}

// Purpose: To toggle the password visibility of Confirm Password in the Teacher Sign-Up page
const TeacherSignUpConfirmPasswordInput = document.getElementById('SignUpWithConfirmTeacherPassword');
const TeacherSignUpConfirmToggleButton = document.getElementById('ToggleSignUpTeacherConfirmPassword');

// function to toggle the password visibility
function toggleSignUpTeacherConfirmPassword() {
    if (TeacherSignUpConfirmPasswordInput.type === 'password') {
        TeacherSignUpConfirmPasswordInput.type = 'text';
        TeacherSignUpConfirmToggleButton.innerHTML = '<i class="fa-solid fa-eye-slash"></i>';
    }
    else {
        TeacherSignUpConfirmPasswordInput.type = 'password';
        TeacherSignUpConfirmToggleButton.innerHTML = '<i class="fa-solid fa-eye"></i>';
    }
}

// Purpose: To toggle the password visibility of Password in the Sign-In page
const SignInPasswordInput = document.getElementById('SignInPassword');
const SignInToggleButton = document.getElementById('ToggleSignInPassword');

// function to toggle the password visibility
function toggleSignInPassword() {
    if (SignInPasswordInput.type === 'password') {
        SignInPasswordInput.type = 'text';
        SignInToggleButton.innerHTML = '<i class="fa-solid fa-eye-slash"></i>';
    }
    else {
        SignInPasswordInput.type = 'password';
        SignInToggleButton.innerHTML = '<i class="fa-solid fa-eye"></i>';
    }
}
document.getElementById('DepartmentSelect').addEventListener('change', function () {
    var department = this.value;
    var subjectSelect = document.getElementById('SubjectSelect');
    subjectSelect.innerHTML = '';

    var subjects = {
        CS: ['Algorithms', 'Data Structures', 'Operating Systems', 'Database Systems'],
        DSAI: ['Machine Learning', 'Data Mining', 'Neural Networks', 'Big Data'],
        CIVIL: ['Structural Engineering', 'Geotechnical Engineering', 'Transportation Engineering', 'Water Resources Engineering']
    };

    if (department && subjects[department]) {
        subjects[department].forEach(function (subject) {
            var option = document.createElement('option');
            option.value = subject.replace(/\s+/g, '-');
            option.textContent = subject;
            subjectSelect.appendChild(option);
        });
    }
});


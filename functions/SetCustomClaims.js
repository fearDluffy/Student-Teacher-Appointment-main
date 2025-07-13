const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();

// Function to set custom claims
exports.setCustomClaims = functions.https.onRequest(async (req, res) => {
  if (req.method === "OPTIONS") {
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "POST");
    res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.set("Access-Control-Max-Age", "3600");
    res.status(204).send("");
    return;
  }

  res.set("Access-Control-Allow-Origin", "*");

  if (req.method !== "POST") {
    return res.status(405).send("Method Not Allowed");
  }

  const {role, displayName, department, subject} = req.body;
  const idToken = req.headers.authorization ?
    req.headers.authorization.split("Bearer ")[1] :
    null;

  if (!role || !["Admin", "Teacher", "Student"].includes(role)) {
    return res.status(400).send("Invalid role.");
  }

  if (!idToken) {
    return res.status(401).send("Authorization token is missing.");
  }

  try {
    // Verify the ID token and get the user ID
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const uid = decodedToken.uid;

    if (displayName) {
      await admin.auth().updateUser(uid, {displayName});
    }

    await admin.auth().setCustomUserClaims(uid, {role});

    if (role === "Teacher") {
      const db = admin.firestore();
      const teacherDocRef = db.collection("teachers").doc(uid);
      await teacherDocRef.set(
          {
            displayName,
            department,
            subject,
          },
          {merge: true},
      );
    }

    return res.status(200).send(
        "User profile and custom claims set successfully.",
    );
  } catch (error) {
    return res.status(500).send(`Error: ${error.message}`);
  }
});

// Function to delete a teacher from Authentication
exports.deleteTeacherFromAuth =
functions.https.onCall(async (data, context) => {
  if (!context.auth || context.auth.token.role !== "Admin") {
    return {error: "Unauthorized"};
  }

  const {teacherId} = data;

  if (!teacherId) {
    return {error: "Teacher ID is required"};
  }

  try {
    // Delete user from Firebase Authentication
    await admin.auth().deleteUser(teacherId);

    // Also delete the teacher document from Firestore
    const db = admin.firestore();
    await db.collection("teachers").doc(teacherId).delete();

    return {message: "User and associated data deleted successfully"};
  } catch (error) {
    console.error(
        "Error deleting user from Authentication and Firestore:", error,
    );
    return {error: "Error deleting user from Authentication and Firestore"};
  }
});

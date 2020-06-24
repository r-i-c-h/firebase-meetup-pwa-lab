// Import stylesheets
import "./style.css";
// Firebase App (the core Firebase SDK) is always required and must be listed first
import * as firebase from "firebase/app";

// Add the Firebase products that you want to use
import "firebase/auth";
import "firebase/firestore";

import * as firebaseui from "firebaseui";

// Document elements

const guestbookContainer = document.getElementById("guestbook-container");
const startRsvpButton = document.getElementById("startRsvp");

const form = document.getElementById("leave-message");
const input = document.getElementById("message");
const guestbook = document.getElementById("guestbook");

const rsvpYes = document.getElementById("rsvp-yes");
const rsvpNo = document.getElementById("rsvp-no");
const numberAttending = document.getElementById("number-attending");

var rsvpListener = null;
var guestbookListener = null;

// Add Firebase project configuration object here
var firebaseConfig = {
  apiKey: "AIzaSyA_lIEOse2oFqB_ibAI_0__vN8dvCJl_p0",
  authDomain: "fir-meetuppwa-codelab.firebaseapp.com",
  databaseURL: "https://fir-meetuppwa-codelab.firebaseio.com",
  projectId: "fir-meetuppwa-codelab",
  storageBucket: "fir-meetuppwa-codelab.appspot.com",
  messagingSenderId: "268437799300",
  appId: "1:268437799300:web:8a51b86d3c18f03715ddd1"
};

firebase.initializeApp(firebaseConfig);

// FirebaseUI config
const uiConfig = {
  credentialHelper: firebaseui.auth.CredentialHelper.NONE,
  signInOptions: [
    // Email / Password Provider.
    firebase.auth.EmailAuthProvider.PROVIDER_ID
  ],
  callbacks: {
    signInSuccessWithAuthResult: function(authResult, redirectUrl) {
      // Handle sign-in.
      // Return false to avoid redirect.
      return false;
    }
  }
};

const ui = new firebaseui.auth.AuthUI(firebase.auth());

// SUBSCRIBE to the CURRENT AUTH STATE
firebase.auth().onAuthStateChanged(user => {
  if (user) {
    startRsvpButton.textContent = "LOGOUT";
    // Show guestbook to logged-in users
    guestbookContainer.style.display = "block";
    subscribeToGuestBook();
    firebase.firestore().collection('attendees')
      .where("attending", "==", true)
      .onSnapshot(snap => {
        const newAttendeeCount = snap.docs.length;
        numberAttending.innerHTML = newAttendeeCount +' people going'; 
    })
    subscribeCurrentRSVP(user);
  } else {
    startRsvpButton.textContent = "RSVP";
    guestbookContainer.style.display = "none";
    unsubscribeToGuestbook();
    unsubscribeCurrentRSVP();
  }
});

function subscribeToGuestBook() {
  var guestBookListener = firebase
    .firestore()
    .collection("guestbook")
    .orderBy("timestamp", "desc")
    .onSnapshot(snaps => {
      // returns an UNSUBSCRIBE function.
      // Reset page
      guestbook.innerHTML = "";
      // Loop through documents in database
      snaps.forEach(doc => {
        // Create an HTML entry for each document and add it to the DOM
        const entry = document.createElement("p");
        entry.textContent = doc.data().name + ": " + doc.data().text;
        guestbook.appendChild(entry);
      });
    });
}

function unsubscribeToGuestbook() {
  if (guestbookListener != null) {
    guestbookListener();
    guestbookListener = null;
  }
}

function subscribeCurrentRSVP(user){
 let rsvpListener = firebase.firestore()
 .collection('attendees')
 .doc(user.uid)
 .onSnapshot((doc) => {
   if (doc && doc.data()){
     const attendingResponse = doc.data().attending;
     // Update css classes for buttons
     if (attendingResponse){
       rsvpYes.className="clicked";
       rsvpNo.className="";
     } else{
       rsvpYes.className="";
       rsvpNo.className="clicked";
     }
   }
 });
}

function unsubscribeCurrentRSVP(){
  if (rsvpListener != null) {
    rsvpListener();
    rsvpListener = null;
  }
  rsvpYes.className="";
  rsvpNo.className="";
}
/*~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/
startRsvpButton.addEventListener("click", e => {
  if (firebase.auth().currentUser) {
    // User is signed in; allows user to sign out
    firebase.auth().signOut();
  } else {
    ui.start("#firebaseui-auth-container", uiConfig); // No user is signed in; allows user to sign in
  }
});
// Listen to the form submission
form.addEventListener("submit", e => {
  // Prevent the default form redirect
  e.preventDefault();
  // Write a new message to the database collection "guestbook"
  firebase
    .firestore()
    .collection("guestbook")
    .add({
      text: input.value,
      timestamp: Date.now(),
      name: firebase.auth().currentUser.displayName,
      userId: firebase.auth().currentUser.uid
    });
  // clear message input field
  input.value = "";
  // Return false to avoid redirect
  return false;
});

rsvpYes.addEventListener('click', () => {
 // Get a reference to the user's document in the attendees collection
 const userDoc = firebase.firestore().collection('attendees').doc(firebase.auth().currentUser.uid);

 // If they RSVP'd yes, save a document with attending: true
 userDoc.set({
   attending: true
 }).catch(console.error)
});

rsvpNo.addEventListener('click', () => {
 const userDoc = firebase.firestore().collection('attendees').doc(firebase.auth().currentUser.uid);
 userDoc.set({
   attending: false
 }).catch(console.error)
});

import firebase from 'firebase/app'

const config = {
  apiKey: 'AIzaSyBoq4mq_Tn-Pi6Vof331A1Pp8ekO9lLK6Y',
  authDomain: 'osrsrecords.com',
  projectId: 'osrs-records',
  storageBucket: 'osrs-records.appspot.com',
}

!firebase.apps?.length && firebase.initializeApp(config)

// export const DB = firebase.database()

export default firebase

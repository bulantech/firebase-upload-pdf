var dTable = null
var db = firebase.firestore();
var dataAll = []

$( document ).ready(function() {
  dTable = $('#myTable').DataTable( {
    "columnDefs": [
      {
        "targets": [ 0 ],
        "visible": false,
        "searchable": false
      },
  ]
  });

  $('#myTable tbody').on( 'click', 'tr', function () {
    console.log('#myTable tbody..')
    if ( $(this).hasClass('selected') ) {
        $(this).removeClass('selected');
    }
    else {
      dTable.$('tr.selected').removeClass('selected');
        $(this).addClass('selected');
    }
  } );

  $( "#loginForm" ).submit(function( event ) {
    $('#loginError').text('') 
    toggleSignIn()
    event.preventDefault();  
  });

  $( "#logout" ).click(function( event ) {
    toggleSignIn()
  });

  // $( "#addฺNow" ).click(function( event ) {    
  //   $('#addModal').modal('show');
  // });

  $( "#addModal" ).find('button[name="add"]').click(function( event ) {    
    console.log('add..')
    const topic = 'เรื่องทดสอบ' + Date.now()//doc.data().topic
    const status = 'เผยแพร่'//doc.data().status
    const type = 'จัดซื้อจัดจ้าง'//doc.data().type
    const publishDate = firebase.firestore.Timestamp.fromDate(new Date()); //doc.data().publishDate.toDate().toLocaleDateString('th-TH', options).split('ที่')[1]
    const fileName = 'จัดซื้อจัดจ้าง.pdf'//doc.data().filePath
    const filePath = 'https://firebasestorage.googleapis.com/v0/b/test-702f6.appspot.com/o/upload%2FMCD-ST%20Liberty%20SW%20License%20Agreement%20V2.pdf?alt=media&token=285b8c33-4f30-49f1-abd7-59ec80628aaf'//doc.data().fileName
    
    const data = { topic, status, type, publishDate, fileName, filePath }

    // Add a new document with a generated id.
    db.collection("upload").add(data)
    .then(function(docRef) {
      console.log("Document written with ID: ", docRef.id);
      const _id = docRef.id
      const file = '<a target="_blank" rel="noopener noreferrer" href="' +filePath+ '">' +fileName+ '</a>'

      const btnEdit = '<button type="button" class="btn btn-primary btn-sm mx-1">แก้ไข</button>'
      const btnDelete = '<button type="button" class="btn btn-danger btn-sm mx-1" onClick="showDelete(\'' + _id + '\')">ลบ</button>'
      const editDelete = '<span class="btn-group">' + btnEdit + btnDelete + '</span>'

      const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
      const publishDate1 = publishDate.toDate().toLocaleDateString('th-TH', options).split('ที่')[1]

      dTable.row.add( [_id, topic, type, status, file, publishDate1, editDelete] ).draw();

      $('#addModal').modal('hide');
    })
    .catch(function(error) {
      console.error("Error adding document: ", error);
      $('#addModal').modal('hide');
    });
  });

  $( "#delete" ).click(function( event ) {  
    const id = dTable.row('.selected').data()[0]
    console.log('delete..', id)  
        
    db.collection("upload").doc(id).delete().then(function() {
      console.log("Document successfully deleted!");
      dTable.row('.selected').remove().draw( false );
    }).catch(function(error) {
      console.error("Error removing document: ", error);
    });

    $('#deleteModal').modal('hide');
  });

  initApp()
});

initApp = () => {   
  firebase.auth().onAuthStateChanged(function(user) {
    console.log('onAuthStateChanged..')
    if (user) {
      // User is signed in.
      const displayName = user.displayName;
      const email = user.email;
      const emailVerified = user.emailVerified;
      const photoURL = user.photoURL;
      const isAnonymous = user.isAnonymous;
      const uid = user.uid;
      const providerData = user.providerData;
      
      console.log('uid =>', uid);
      $('#loginModal').modal('hide');
      // $('#logout').removeClass('d-none');

      $( "#inputEmail" ).val('')
      $( "#inputPassword" ).val('')

      dTable.clear().draw();
      getDatabase()
      $( "#divTable" ).removeClass('d-none');

    } else {
      // User is signed out.
      $('#loginError').text('')
      $('#loginModal').modal('show');
      // $('#logout').addClass('d-none');
      $( "#divTable" ).addClass('d-none');
    }

  });
  // [END authstatelistener]
}

toggleSignIn = () => {
  console.log('toggleSignIn..');
  if (firebase.auth().currentUser) {
    firebase.auth().signOut();
    $('#loginModal').modal('show');
  } else {
    const email = $( "#inputEmail" ).val()
    const password = $( "#inputPassword" ).val()

    firebase.auth().signInWithEmailAndPassword(email, password).catch(function(error) {
      // Handle Errors here.
      const errorCode = error.code;
      const errorMessage = error.message;
      console.log(error);
      $('#loginError').text(errorCode.split('auth/').join('').split('-').join(' ') )

    });
  }
}

getDatabase = () => {
  db.collection("upload").orderBy("publishDate", "desc").get().then((querySnapshot) => {
    querySnapshot.forEach((doc) => {
      // console.log(`${doc.id} => ${doc.data()}`, doc.data(), doc.data().insertDate.toDate() );
      const topic = doc.data().topic
      const status = doc.data().status
      // if(status!='publish') return
      const type = doc.data().type
      const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
      const publishDate = doc.data().publishDate.toDate().toLocaleDateString('th-TH', options).split('ที่')[1]
      const path = doc.data().filePath
      const fileName = doc.data().fileName
      const file = '<a target="_blank" rel="noopener noreferrer" href="' +path+ '">' +fileName+ '</a>'
      const _id = doc.id
      const data = {...doc.data(), _id: doc.id}

      const btnEdit = '<button type="button" class="btn btn-primary btn-sm mx-1">แก้ไข</button>'
      const btnDelete = '<button type="button" class="btn btn-danger btn-sm mx-1" onClick="showDelete(\'' + topic+ '\')">ลบ</button>'
      const editDelete = '<span class="btn-group">' + btnEdit + btnDelete + '</span>'

      dataAll.push(data)
      console.log('dataAll =>', dataAll)
      dTable.row.add( [_id, topic, type, status, file, publishDate, editDelete] ).draw();
    });
  });
}

showDelete = (topic) => {
  // const result = dataAll.find( ({ _id }) => _id === id );
  $('#deleteModal').find('.modal-body').text(topic)
  $('#deleteModal').modal('show');
}
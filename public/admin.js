var dTable = null
var db = firebase.firestore();
var dataAll = []
var file = null

$( document ).ready(function() {
  dTable = $('#myTable').DataTable( {
    "columnDefs": [
      {
        "targets": [ 0,1 ],
        "visible": false,
        "searchable": false
      },
  ]
  });

  $('#myTable tbody').on( 'click', 'tr', function () {
    console.log('#myTable tbody..')
    if ( $(this).hasClass('selected') ) {
      // $(this).removeClass('selected');
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

  $( "#addฺNow" ).click(function( event ) {  
    $("#addModal").find('button[name="add"]').removeClass('d-none')
    $("#addModal").find('button[name="edit"]').addClass('d-none')  
    $("#addModal").find('.modal-title').text('เพิ่มประกาศ')
    $("#addModal").find('input').each(function () {
      $(this).val('');
    })
    $('#addModal').modal('show');
  });

  $( "#addForm" ).submit(function( event ) {
    const title = $("#addModal").find('.modal-title').text()
    console.log('title', title)
    if(title === 'เพิ่มประกาศ') {
      addData()
    } else {
      editData()
    }
    event.preventDefault();  
  });

  $( "#delete" ).click(function( event ) {  
    deleteData()
  });

  $('.datepicker').datepicker({
    language: 'th',
    format: 'dd-mm-yyyy',
  });

  // Add the following code if you want the name of the file appear on select
  $(".custom-file-input").on("change", function(event) {
    // console.log('event =>', event)
    file = event.target.files[0];
    var fileName = $(this).val().split("\\").pop();
    $(this).siblings(".custom-file-label").addClass("selected").html(fileName);
  });

  initApp()

}); // end $( document ).ready(function() {

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
      const fileUrl = doc.data().fileUrl
      const filePath = doc.data().filePath
      const fileName = doc.data().fileName
      const file = '<a target="_blank" rel="noopener noreferrer" href="' +fileUrl+ '">' +fileName+ '</a>'
      const _id = doc.id
      const data = {...doc.data(), _id: doc.id}

      const btnEdit = '<button type="button" class="btn btn-primary btn-sm mx-1" onClick="showEdit(\'' + _id+ '\')">แก้ไข</button>'
      const btnDelete = '<button type="button" class="btn btn-danger btn-sm mx-1" onClick="showDelete(\'' + topic+ '\')">ลบ</button>'
      const editDelete = '<span class="btn-group">' + btnEdit + btnDelete + '</span>'

      dataAll.push(data)
      console.log('dataAll =>', dataAll)
      dTable.row.add( [_id, filePath, topic, type, file, publishDate, editDelete] ).draw();
    });
  });
}

showDelete = (topic) => {
  console.log('showDelete..')
  // const result = dataAll.find( ({ _id }) => _id === id );
  // topic = dTable.row('.selected').data()[2]
  $('#deleteModal').find('.modal-body').text(topic)
  $('#deleteModal').modal('show');
}

showEdit = (id) => {
  // const result = dataAll.find( ({ _id }) => _id === id );
  $('#addModal').data('id', id)
  $("#addModal").find('button[name="add"]').addClass('d-none')
  $("#addModal").find('button[name="edit"]').removeClass('d-none')  
  $("#addModal").find('.modal-title').text('แก้ไขประกาศ')
  $('#addModal').modal('show');
}

// add
addData = () => {
// $( "#addModal" ).find('button[name="add"]').click(function( event ) {      
  console.log('add..')
  const storageRef = firebase.storage().ref('upload');
  const metadata = {
    'contentType': file.type
  };
  const yyyy = new Date().getFullYear()
  const mm = new Date().getMonth()
  const dd = new Date().getDate()
  const filePath = yyyy+'/'+mm+'/'+dd+'/'+file.name

  storageRef.child(filePath).put(file, metadata).then(function(snapshot) {
    // console.log('Uploaded', snapshot.totalBytes, 'bytes.');
    // console.log('File metadata:', snapshot.metadata);
    snapshot.ref.getDownloadURL().then(function(url) {
      // console.log('File available at', url);
      const topic = $("#addModal").find('input[name="topic"]').val()
      // const status = 'เผยแพร่'//doc.data().status
      const type = $("#addModal").find('option:selected').text();
      const date = $('.datepicker').datepicker("getDate") //$(".datepickerr").data('datepicker').getFormattedDate('yyyy-mm-dd') //$("#addModal").find('input[name="date"]').data('date')
      const publishDate = firebase.firestore.Timestamp.fromDate(new Date(date));
      const insertDate = firebase.firestore.Timestamp.fromDate(new Date());       
      const fileName = file.name
      const fileUrl = url        
      const data = { topic, status, type, publishDate, fileName, filePath, fileUrl, insertDate }
      // console.log('data =>',date , data);

      // Add a new document with a generated id.
      db.collection("upload").add(data)
      .then(function(docRef) {
        console.log("Document written with ID: ", docRef.id);
        const _id = docRef.id
        const file = '<a target="_blank" rel="noopener noreferrer" href="' +fileUrl+ '">' +fileName+ '</a>'

        const btnEdit = '<button type="button" class="btn btn-primary btn-sm mx-1" onClick="showEdit(\'' + _id+ '\')">แก้ไข</button>'
        const btnDelete = '<button type="button" class="btn btn-danger btn-sm mx-1" onClick="showDelete(\'' + topic + '\')">ลบ</button>'
        const editDelete = '<span class="btn-group">' + btnEdit + btnDelete + '</span>'

        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        const publishDate1 = publishDate.toDate().toLocaleDateString('th-TH', options).split('ที่')[1]

        dTable.row.add( [_id, filePath, topic, type, file, publishDate1, editDelete] ).draw();

        $('#addModal').modal('hide');
      })
      .catch(function(error) {
        console.error("Error adding document: ", error);
        $('#addModal').modal('hide');
      });
    });

  }).catch(function(error) {
    console.error('Upload failed:', error);
  });

  // });
}

// edit
editData = () => {
// $("#addModal").find('button[name="edit"]').click(function( event ) {
  const id = $("#addModal").data('id')
  // const result = dataAll.find( ({ _id }) => _id === id )
  db.collection("upload").doc(id).update({
    capital: true
  })
  .then(function() {
    console.log("Document successfully updated!");

    const topic = 'doc.data().topic'
    const status = 'doc.data().status'
    // if(status!='publish') return
    const type = 'doc.data().type'
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const publishDate = new Date().toLocaleDateString('th-TH', options).split('ที่')[1]
    const path = 'doc.data().filePath'
    const fileName = 'doc.data().fileName'
    const file = '<a target="_blank" rel="noopener noreferrer" href="' +path+ '">' +fileName+ '</a>'
    const _id = id
    // const data = {...doc.data(), _id: doc.id}
    const btnEdit = '<button type="button" class="btn btn-primary btn-sm mx-1" onClick="showEdit(\'' + _id+ '\')">แก้ไข</button>'
    const btnDelete = '<button type="button" class="btn btn-danger btn-sm mx-1" onClick="showDelete(\'' + topic+ '\')">ลบ</button>'
    const editDelete = '<span class="btn-group">' + btnEdit + btnDelete + '</span>'

    dTable.row('.selected').data([_id, topic, type, file, publishDate, editDelete]).draw();
    $('#addModal').modal('hide');
  })
  .catch(function(error) {
    // The document probably doesn't exist.
    console.error("Error updating document: ", error);
    $('#addModal').modal('hide');
  });
// });
}

// delete
deleteData = () => {
  const id = dTable.row('.selected').data()[0]
  const filePath = dTable.row('.selected').data()[1]
  console.log('delete..', id, filePath)  
      
  db.collection("upload").doc(id).delete().then(function() {
    console.log("Document successfully deleted!");
    dTable.row('.selected').remove().draw( false );
    $('#deleteModal').modal('hide');
  }).catch(function(error) {
    console.error("Error removing document: ", error);
    $('#deleteModal').modal('hide');
  });

  // Create a reference to the file to delete
  const storageRef = firebase.storage().ref('upload');
  const desertRef = storageRef.child(filePath);
  // Delete the file
  desertRef.delete().then(function() {
    console.log("File deleted successfully");
  }).catch(function(error) {
    console.log("Uh-oh, an error occurred!");
  });
}
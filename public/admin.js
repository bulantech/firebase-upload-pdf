var dTable = null
var db = firebase.firestore();
var dataAll = []
var file = null
var userLogin = null

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
    // console.log('#myTable tbody..')
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
    file = null
    $("#inputGroupFile04").val(null);
    $("#addModal").find(".custom-file-label").text(null);

    $("#addModal").find('button[name="add"]').removeClass('d-none')
    $("#addModal").find('button[name="edit"]').addClass('d-none')
    $("#addModal").find('button[name="wait"]').addClass('d-none')  
    $("#addModal").find('.modal-title').text('เพิ่มประกาศ')
    $("#addModal").find('input').each(function () {
      $(this).val('');
    })

    $("#addModal").find('label[name="docLabel"]').removeClass('d-none')
    $("#addModal").find('div[name="docCheckbox"]').addClass('d-none') 
    $("#addModal").find('input[name="file"]').prop( "disabled", false );
    $('#addModal').modal('show');

  });

  $( "#addForm" ).submit(function( event ) {
    const title = $("#addModal").find('.modal-title').text()
    console.log('title', title)
    $("#addModal").find('button[name="add"]').addClass('d-none')
    $("#addModal").find('button[name="edit"]').addClass('d-none')
    $("#addModal").find('button[name="wait"]').removeClass('d-none') 
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
    const fileName = $(this).val().split("\\").pop();
    $(this).siblings(".custom-file-label").addClass("selected").html(fileName);
  });

  $('#exampleCheck1').on('change', function() {
    const val = this.checked ? true : false; //this.value
    console.log('val =>', val)
    val ? $("#addModal").find('input[name="file"]').prop( "disabled", false ) : $("#addModal").find('input[name="file"]').prop( "disabled", true )
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

      userLogin = user
      
      console.log('uid =>', uid);
      $('#loginModal').modal('hide');
      // $('#logout').removeClass('d-none');

      $( "#inputEmail" ).val('')
      $( "#inputPassword" ).val('')

      dTable.clear().draw();      
      $( "#divTable" ).removeClass('d-none');

      $( "#userEmail" ).text(email)

      checkUserRole(email)      
      // getDatabase()

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

checkUserRole = (email) => {
  // Update user login
  db.collection("users").doc(email).update({
    lastLogin: firebase.firestore.Timestamp.fromDate(new Date()),
  })
  .then(function() {
    console.log("users Document successfully updated!");
    // Get role
    db.collection("users").doc(email).get()
    .then(function(doc) {
      if (doc.exists) {
        console.log("Document data:", doc.data());
        (doc.data().role === 'root') ? getDatabase('root') : getDatabase(email)
      } else {
        console.log("No such document!");
      }
    }).catch(function(error) {
      console.log("Error getting document:", error);
    });

  })
  .catch(function(error) {
    console.error("users Error updating document: ", error);

    // set new doc
    db.collection("users").doc(email).set({
      lastLogin: firebase.firestore.Timestamp.fromDate(new Date()),
      role: "editor"
    })
    .then(function() {
      console.log("Document written: ", );
      checkUserRole(email)
    })
    .catch(function(error) {
      console.error("Error adding document: ", error);
    });

  });
}

toggleSignIn = () => {
  console.log('toggleSignIn..');
  if (firebase.auth().currentUser) {
    // Update lastLogout
    db.collection("users").doc(userLogin.email).update({
      lastLogout: firebase.firestore.Timestamp.fromDate(new Date()),
    })
    .then(function() {
      console.log("users Document successfully updated!")  
    })
    .catch(function(error) {
      console.error("users Error updating document: ", error);
    });

    firebase.auth().signOut();
    userLogin = null
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

getDatabase = (email) => {
  const docRef = db.collection("upload").orderBy("publishDate", "desc")
  // let query = null
  const query = (email==='root') ? docRef.where("publishDate", "!=", false) : docRef.where("updateBy", "==", email)
  query.get().then((querySnapshot) => {
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
      // console.log('dataAll =>', dataAll)
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
  const result = dataAll.find( ({ _id }) => _id === id );
  const topic = result.topic
  const type = result.type
  const fileName = result.fileName
  const publishDate = result.publishDate  

  file = null

  // console.log('showEdit..', id, topic, type, fileName, publishDate)
  $("#addModal").find('input[name="topic"]').val(topic)
  $("#addModal").find('select[name="type"]').val(type)
  // $("#addModal").find('input[name="date"]').val('publishDate')
  $('.datepicker').datepicker('update', publishDate.toDate());
  
  $("#addModal").find('label[name="docLabel"]').addClass('d-none')
  $("#addModal").find('div[name="docCheckbox"]').removeClass('d-none')
  $("#addModal").find('input[name="file"]').prop( "disabled", true );
  $('#exampleCheck1').prop('checked', false)
 
  $('#addModal').data('id', id)
  $("#addModal").find('button[name="add"]').addClass('d-none')
  $("#addModal").find('button[name="edit"]').removeClass('d-none')  
  $("#addModal").find('button[name="wait"]').addClass('d-none') 

  file = null
  $("#inputGroupFile04").val(null);
  $("#addModal").find(".custom-file-label").text(null);
  
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
      const updateDate = firebase.firestore.Timestamp.fromDate(new Date());   
      const fileName = file.name
      const fileUrl = url   
      const updateBy = userLogin.email     
      const data = { topic, status, type, publishDate, fileName, filePath, fileUrl, insertDate, updateDate, updateBy }
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
        const data1 = {...data, _id}
        dataAll.push(data1)

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
  const id = $("#addModal").data('id')  
  const result = dataAll.find( ({ _id }) => _id === id )
  
  const topic = $("#addModal").find('input[name="topic"]').val()
  // // const status = 'เผยแพร่'//doc.data().status
  const type = $("#addModal").find('option:selected').text();
  const date = $('.datepicker').datepicker("getDate") //$(".datepickerr").data('datepicker').getFormattedDate('yyyy-mm-dd') //$("#addModal").find('input[name="date"]').data('date')
  const publishDate = firebase.firestore.Timestamp.fromDate(new Date(date));
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  const publishDate1 = publishDate.toDate().toLocaleDateString('th-TH', options).split('ที่')[1]
  const insertDate = firebase.firestore.Timestamp.fromDate(new Date());
  const updateDate = firebase.firestore.Timestamp.fromDate(new Date());       
  let fileName = result.fileName
  let filePath = result.filePath
  let fileUrl = result.fileUrl   
  const fileLink = '<a target="_blank" rel="noopener noreferrer" href="' +fileUrl+ '">' +fileName+ '</a>'  
  const _id = id   
  
  // const data = { topic, status, type, publishDate, fileName, filePath, fileUrl, insertDate, updateDate }
  const btnEdit = '<button type="button" class="btn btn-primary btn-sm mx-1" onClick="showEdit(\'' + _id+ '\')">แก้ไข</button>'
  const btnDelete = '<button type="button" class="btn btn-danger btn-sm mx-1" onClick="showDelete(\'' + topic+ '\')">ลบ</button>'
  const editDelete = '<span class="btn-group">' + btnEdit + btnDelete + '</span>'

  const updateBy = userLogin.email

  if(file) {
    console.log('editData upload..')
    const storageRef = firebase.storage().ref('upload');
    const metadata = {
      'contentType': file.type
    };
    const yyyy = new Date().getFullYear()
    const mm = new Date().getMonth()
    const dd = new Date().getDate()
    filePath = yyyy+'/'+mm+'/'+dd+'/'+file.name
    fileName = file.name
    
    storageRef.child(filePath).put(file, metadata).then(function(snapshot) {
      // console.log('Uploaded', snapshot.totalBytes, 'bytes.');
      // console.log('File metadata:', snapshot.metadata);
      snapshot.ref.getDownloadURL().then(function(url) {
        // console.log('File available at', url);
        
        fileUrl = url
        const data = { topic, status, type, publishDate, fileName, filePath, fileUrl, insertDate, updateDate, updateBy }
        const fileLink = '<a target="_blank" rel="noopener noreferrer" href="' +fileUrl+ '">' +fileName+ '</a>'

        db.collection("upload").doc(id).update(data)
        .then(function() {
          console.log("Document successfully updated!");
          dTable.row('.selected').data([_id, filePath, topic, type, fileLink, publishDate1, editDelete]).draw();
          $('#addModal').modal('hide');
        })
        .catch(function(error) {
          // The document probably doesn't exist.
          console.error("Error updating document: ", error);
          $('#addModal').modal('hide');
        }); 

      });

    }).catch(function(error) {
      console.error('Upload failed:', error);
    });
  }
  else {
    const data = { topic, status, type, publishDate, fileName, filePath, fileUrl, insertDate, updateDate, updateBy }

    db.collection("upload").doc(id).update(data)
    .then(function() {
      console.log("Document successfully updated!");
      dTable.row('.selected').data([_id, filePath, topic, type, fileLink, publishDate1, editDelete]).draw();
      $('#addModal').modal('hide');
    })
    .catch(function(error) {
      // The document probably doesn't exist.
      console.error("Error updating document: ", error);
      $('#addModal').modal('hide');
    });
  } // else {
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
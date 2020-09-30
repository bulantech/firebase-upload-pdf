var db = firebase.firestore();

db.collection("upload").orderBy("publishDate", "desc").get().then((querySnapshot) => {
  querySnapshot.forEach((doc) => {
    console.log(`${doc.id} => ${doc.data()}`, doc.data(), doc.data().insertDate.toDate() );
    
    const status = doc.data().status
    if(status!='publish') return

    const type = doc.data().type
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const publishDate = doc.data().publishDate.toDate().toLocaleDateString('th-TH', options).split('ที่')[1]
    const path = doc.data().filePath
    const btn = '<button type="button" class="btn btn-sm btn-outline-primary ml-2" onclick="window.open(\''+ path +'\')" >ดูเอกสาร</button>'
    // const btn = '<span class="badge badge-primary ml-2">ดูเอกสาร</span>'
    const str = '<p class="mb-0">' + doc.data().topic + ' ณ วันที่ ' + publishDate + btn + '</p>'
    switch(type) {
      case 'news':
        $('#not-news').addClass('d-none')
        $('#nav-news').append(str)
        $('#nav-news').append(str)
        $('#nav-news').append(str)
        break
      case 'procurement':
        $('#not-procurement').addClass('d-none')
        $('#nav-procurement').append(str)
        break
    }
  });
});

// // Date to Timestamp
// const t = firebase.firestore.Timestamp.fromDate(new Date());
// // Timestamp to Date
// const d = t.toDate();
// console.log(`t => ${t}, d => ${d}`);
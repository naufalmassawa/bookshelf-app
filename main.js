// Array yang menampung object berisikan data books
const books = [];
// Inisialisasi Custom Event
const RENDER_EVENT = 'render-book';
const SAVED_EVENT = 'saved_book';
const STORAGE_KEY = 'BOOKSHELF_APP';

// Menjalankan kode ketika event DOMContentLoader terjadi
document.addEventListener('DOMContentLoaded', function() {
  const submitBook = document.getElementById('bookForm');
  submitBook.addEventListener('submit', function (event) {
    event.preventDefault();
    addBook();
  });

  const searchBook = document.getElementById('searchBook');
  const searchBookTitle = document.getElementById('searchBookTitle');
  searchBook.addEventListener('submit', function(event) {
    event.preventDefault();
    const searchQuery = searchBookTitle.value.trim().toLowerCase();
    const filteredBooks = books.filter((book) => 
      book.title.toLowerCase().includes(searchQuery)
    );
    document.dispatchEvent(new CustomEvent(RENDER_EVENT, { detail: filteredBooks }));
  });

  if(isStorageExist()) {
    loadDataFromStorage();
  }
});

// Berfungsi untuk menambahkan books
function addBook() {
  const bookTitle = document.getElementById('bookFormTitle').value;
  const bookAuthor = document.getElementById('bookFormAuthor').value;
  const bookYear = Number(document.getElementById('bookFormYear').value);
  const bookIsComplete = document.getElementById('bookFormIsComplete').checked;

  const generateID = generateId();
  const bookObject = generateBookObject(generateID, bookTitle, bookAuthor, bookYear, bookIsComplete);
  books.push(bookObject);
  document.getElementById('bookForm').reset();

  // Render data yang telah disimpan pada books
  document.dispatchEvent(new Event(RENDER_EVENT));
  saveData();
}

function generateId() {
  return +new Date();
}

function generateBookObject(id, title, author, year, isComplete) {
  return {
    id, title, author, year, isComplete
  };
}

// Menampilkan books pada container sesuai dengan statusnya
document.addEventListener(RENDER_EVENT, function(event) {
  const uncompletedBookList = document.getElementById('incompleteBookList');
  uncompletedBookList.innerHTML = '';

  const completedBookList = document.getElementById('completeBookList');
  completedBookList.innerHTML = '';

  for(const book of (event.detail || books)) {
    const bookElement = makeBook(book);
    if(!book.isComplete) {
      uncompletedBookList.append(bookElement);
    }
    else {
      completedBookList.append(bookElement);
    }
  }
});

// Menambahkan container pada HTML berisi data book
function makeBook(bookObject) {
  const bookItemTitle = document.createElement('h3');
  bookItemTitle.setAttribute('data-testid', 'bookItemTitle');
  bookItemTitle.classList.add('bookItemTitle');
  bookItemTitle.innerText = bookObject.title;

  const bookItemAuthor = document.createElement('p');
  bookItemAuthor.setAttribute('data-testid', 'bookItemAuthor');
  bookItemAuthor.classList.add('bookItemAuthor');
  bookItemAuthor.innerText = `Penulis: ${bookObject.author}`;

  const bookItemYear = document.createElement('p');
  bookItemYear.setAttribute('data-testid', 'bookItemYear');
  bookItemYear.classList.add('bookItemYear');
  bookItemYear.innerText = `Tahun: ${bookObject.year}`;

  const actions = document.createElement('div');
  actions.classList.add('actions');

  const bookItemContainer = document.createElement('div');
  bookItemContainer.setAttribute('data-bookid', bookObject.id);
  bookItemContainer.setAttribute('data-testid', 'bookItem');
  bookItemContainer.classList.add('bookItem');
  bookItemContainer.append(bookItemTitle, bookItemAuthor, bookItemYear, actions);

  const deleteButton = createDeleteButton(bookObject.id);
  const editButton = createEditButton(bookObject.id);

  if(bookObject.isComplete) {
    // Menambahkan fitur memindahkan buku ke rak 'Belum Selesai DIbaca' pada elemen HTML
    const undoButton = document.createElement('button');
    undoButton.setAttribute('data-testid', 'bookItemIsCompleteButton');
    undoButton.classList.add('undoButton');
    undoButton.innerText = 'Belum Selesai Dibaca';

    undoButton.addEventListener('click', function() {
      undoBookFromCompleted(bookObject.id);
    });

    actions.append(undoButton, deleteButton, editButton);
  }
  else {
    // Menambahkan fitur memindahkan buku ke rak 'Selesai Dibaca' pada elemen HTML
    const doneButton = document.createElement('button');
    doneButton.setAttribute('data-testid', 'bookItemIsCompleteButton');
    doneButton.classList.add('doneButton');
    doneButton.innerText = 'Selesai Dibaca';

    doneButton.addEventListener('click', function() {
      addBookToCompleted(bookObject.id);
    });

    actions.append(doneButton, deleteButton, editButton);
  }

  return bookItemContainer;
}

// Helper untuk delete button
function createDeleteButton(bookId) {
  // Menambahkan fitur hapus buku pada elemen HTML
  const deleteButton = document.createElement('button');
  deleteButton.setAttribute('data-testid', 'bookItemDeleteButton');
  deleteButton.classList.add('deleteButton');
  deleteButton.innerText = 'Hapus Buku';
  deleteButton.addEventListener('click', function() {
    deleteBook(bookId);
  });

  return deleteButton;
}

// Helper untuk edit button
function createEditButton(bookId) {
  // Menambahkan fitur edit buku pada halaman HTML
  const editButton = document.createElement('button');
  editButton.setAttribute('data-testid', 'bookItemEditButton');
  editButton.classList.add('editButton');
  editButton.innerText = 'Edit Buku';
  editButton.addEventListener('click', function() {
    editBook(bookId);
  });

  return editButton;
}

// Memindahkan buku ke rak "Selesai dibaca"
function addBookToCompleted(bookId) {
  const bookTarget = findBook(bookId);
  
  if(bookTarget === null) return;
  bookTarget.isComplete = true;
  document.dispatchEvent(new Event(RENDER_EVENT));
  saveData();
}

// Mencari buku berdasarkan Id
function findBook(bookId) {
  for(const bookItem of books) {
    if(bookItem.id === bookId) {
      return bookItem;
    }
  }
  return null;
}

// Menghapus buku dari rak berdasarkan index
function deleteBook(bookId) {
  const bookTarget = findBookIndex(bookId);

  if(bookTarget === -1) return;

  books.splice(bookTarget, 1);
  document.dispatchEvent(new Event(RENDER_EVENT));
  saveData();
}

// Mencari book berdasarkan index
function findBookIndex(bookId) {
  for(const index in books) {
    if(books[index].id === bookId) {
      return index;
    }
  }

  return -1;
}

// Memindahkan book ke rak "Belum selesai dibaca"
function undoBookFromCompleted(bookId) {
  const bookTarget = findBook(bookId);

  if(bookTarget === null) return;

  bookTarget.isComplete = false;
  document.dispatchEvent(new Event(RENDER_EVENT));
  saveData();
}

// Mengedit buku
function editBook(bookId) {
  const bookTarget = findBook(bookId);

  if(!bookTarget) return;

  if(document.getElementById('editBookOverlay')) return;

  const editBookOverlay = document.createElement('div');
  editBookOverlay.id = 'editBookOverlay';

  const editBookModal = document.createElement('div');
  editBookModal.id = 'editBookModal';

  const modalTitle = document.createElement('h2');
  modalTitle.innerText = 'Edit Buku';

  const editBookForm = document.createElement('form');
  editBookForm.id = 'editBookForm';

  const editBookFormElement = document.createElement('div');
  editBookFormElement.classList.add('editBookFormElement');

  // Input judul buku
  const editBookLabelTitle = document.createElement('label');
  editBookLabelTitle.innerText = 'Judul';

  const editBookInputTitle = document.createElement('input');
  editBookInputTitle.type = 'text';
  editBookInputTitle.value = bookTarget.title;
  editBookInputTitle.required = true;

  // Input penulis buku
  const editBookLabelAuthor = document.createElement('label');
  editBookLabelAuthor.innerText = 'Penulis';

  const editBookInputAuthor = document.createElement('input');
  editBookInputAuthor.type = 'text';
  editBookInputAuthor.value = bookTarget.author;
  editBookInputAuthor.required = true;

  // Input tahun buku
  const editBookLabelYear = document.createElement('label');
  editBookLabelYear.innerText = 'Tahun';

  const editBookInputYear = document.createElement('input');
  editBookInputYear.type = 'number';
  editBookInputYear.value = bookTarget.year;
  editBookInputYear.required = true;

  // Button action untuk modal
  const editBookModalAction = document.createElement('div');
  editBookModalAction.id = 'editBookModalAction';

  const acceptButton = document.createElement('button');
  acceptButton.id = 'acceptButton';
  acceptButton.type = 'submit';
  acceptButton.innerText = 'Simpan';
  
  const cancelButton = document.createElement('button');
  cancelButton.id = 'cancelButton';
  cancelButton.type = 'button';
  cancelButton.innerText = 'Batal';

  editBookModalAction.appendChild(acceptButton);
  editBookModalAction.appendChild(cancelButton);

  editBookFormElement.appendChild(editBookLabelTitle);
  editBookFormElement.appendChild(editBookInputTitle);
  editBookFormElement.appendChild(editBookLabelAuthor);
  editBookFormElement.appendChild(editBookInputAuthor);
  editBookFormElement.appendChild(editBookLabelYear);
  editBookFormElement.appendChild(editBookInputYear);

  editBookForm.appendChild(editBookFormElement);
  editBookForm.appendChild(editBookModalAction);

  editBookModal.appendChild(modalTitle);
  editBookModal.appendChild(editBookForm);

  editBookOverlay.appendChild(editBookModal);

  document.body.appendChild(editBookOverlay);
  void editBookOverlay.offsetWidth;
  editBookOverlay.classList.add('active');

  cancelButton.addEventListener('click', function () {
    editBookOverlay.classList.remove('active');
    setTimeout(() => {
      document.body.removeChild(editBookOverlay);
    }, 300);
  });

  editBookForm.addEventListener('submit', function (event) {
    event.preventDefault();
    // Update object buku
    bookTarget.title = editBookInputTitle.value.trim();
    bookTarget.author = editBookInputAuthor.value.trim();
    bookTarget.year = Number(editBookInputYear.value.trim());
    document.body.removeChild(editBookOverlay);

    document.dispatchEvent(new Event(RENDER_EVENT));
    saveData();
  });
}

// Menyimpan data pada storage
function saveData() {
  if(isStorageExist()) {
    const parsed = JSON.stringify(books);
    localStorage.setItem(STORAGE_KEY, parsed);
    document.dispatchEvent(new Event(SAVED_EVENT));
  }
}

// Mengembalikan nilai boolean untuk menentukan apakah browser mendukung web storage
function isStorageExist() {
  if(typeof(Storage) === 'undefined') {
    alert('Browser tidak mendukung Local Storage');
    return false;
  }
  return true;
}

function loadDataFromStorage() {
  const serializedData = localStorage.getItem(STORAGE_KEY);
  const data = JSON.parse(serializedData);

  if(data !== null) {
    for(const book of data) {
      books.push(book);
    }
  }
  document.dispatchEvent(new Event(RENDER_EVENT));
}

document.addEventListener(SAVED_EVENT, function() {
  console.log(localStorage.getItem(STORAGE_KEY));
});
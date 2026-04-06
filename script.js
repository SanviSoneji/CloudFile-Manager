const supabaseUrl = "https://ihifszeludiflgnxtpcd.supabase.co";
const supabaseKey = "sb_publishable_BgLRLmD24CYwDw1E-X8vYA_WTGIXarJ";

const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

async function uploadFile(event) {
  const file = document.getElementById("fileInput").files[0];

  if (!file) {
    alert("Please select a file");
    return;
  }

  const allowedTypes = ["image/png", "image/jpeg", "application/pdf"];

  if (!allowedTypes.includes(file.type)) {
    alert("Only images and PDFs allowed");
    return;
  }

  if (file.size > 5 * 1024 * 1024) {
    alert("File too large (max 5MB)");
    return;
  }

  const btn = event.target;
  btn.innerText = "Uploading...";
  btn.disabled = true;

  const user = (await supabaseClient.auth.getUser()).data.user;

  if (!user) {
    alert("Please login first");
    btn.innerText = "Upload";
    btn.disabled = false;
    return;
  }

  const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "");
  const filePath = `${user.id}/${safeName}`;

  const { error } = await supabaseClient.storage
    .from("files")
    .upload(filePath, file);

  if (error) {
    alert("Upload failed: " + error.message);
  } else {
    alert("File uploaded successfully!");
    document.getElementById("fileInput").value = "";
    displayFiles();
  }

  btn.innerText = "Upload";
  btn.disabled = false;
}

async function signUp() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  const { error } = await supabaseClient.auth.signUp({
    email,
    password,
  });

  if (error) {
    alert(error.message);
    return;
  }

  // 🔥 AUTO LOGIN AFTER SIGNUP
  const { error: loginError } = await supabaseClient.auth.signInWithPassword({
    email,
    password,
  });

  if (loginError) {
    alert("Signup done, but login failed");
  } else {
    alert("Signup & Login successful!");
  }
}

async function signIn() {
  const btn = event.target;
  btn.disabled = true;

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  const { error } = await supabaseClient.auth.signInWithPassword({
    email,
    password,
  });

  if (error) alert(error.message);
  else alert("Login successful!");

  btn.disabled = false;
}

async function signOut() {
  await supabaseClient.auth.signOut();
  alert("Logged out!");
}

async function displayFiles() {
  const user = (await supabaseClient.auth.getUser()).data.user;
  if (!user) return;

  const { data, error } = await supabaseClient.storage
    .from("files")
    .list(user.id);

  const list = document.getElementById("fileList");
  list.innerHTML = "";

  if (error) {
    list.innerHTML = "<p>Error loading files</p>";
    return;
  }

  if (!data || data.length === 0) {
    list.innerHTML = `
  <div style="text-align:center; color:#777; margin-top:30px;">
    📂 No files uploaded yet
  </div>
`;
    return;
  }

  for (const file of data) {
    const filePath = `${user.id}/${file.name}`;

    const { data: signedUrlData, error: urlError } =
      await supabaseClient.storage
        .from("files")
        .createSignedUrl(filePath, 60);

    if (urlError) continue;

    const card = document.createElement("div");
    card.className = "file-card";

    card.innerHTML = `
  <img src="${signedUrlData.signedUrl}" alt="file"/>
  <div class="file-name">${file.name}</div>

  <div style="display:flex; justify-content:space-between;">
    <a href="${signedUrlData.signedUrl}" target="_blank">View</a>
    <button class="delete-btn" onclick="deleteFile('${file.name}')">Delete</button>
  </div>
`;

    list.appendChild(card);
  }
}
async function deleteFile(fileName) {
  const user = (await supabaseClient.auth.getUser()).data.user;
  if (!user) return;

  const filePath = `${user.id}/${fileName}`;

  const { error } = await supabaseClient.storage
    .from("files")
    .remove([filePath]);

  if (error) alert(error.message);
  else displayFiles();
}

supabaseClient.auth.onAuthStateChange((event, session) => {
  if (session) {
    document.getElementById("uploadSection").style.display = "block";
    document.getElementById("filesSection").style.display = "block";

    document.getElementById("userEmail").innerText =
      "Logged in as " + session.user.email;

    displayFiles();
  } else {
    document.getElementById("uploadSection").style.display = "none";
    document.getElementById("filesSection").style.display = "none";

    document.getElementById("fileList").innerHTML = "";
    document.getElementById("userEmail").innerText = "";
  }
});

window.signUp = signUp;
window.signIn = signIn;
window.signOut = signOut;
window.uploadFile = uploadFile;
window.deleteFile = deleteFile;

supabaseClient.auth.onAuthStateChange((event, session) => {
  console.log("SESSION:", session);

  if (session) {
    document.getElementById("uploadSection").style.display = "block";
    displayFiles();
  } else {
    document.getElementById("uploadSection").style.display = "none";
    document.getElementById("fileList").innerHTML = "";
  }
});

window.signUp = signUp;
window.signIn = signIn;
window.signOut = signOut;
window.uploadFile = uploadFile;
window.deleteFile = deleteFile;
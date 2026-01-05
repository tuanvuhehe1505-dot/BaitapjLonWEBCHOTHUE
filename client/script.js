const API = "http://localhost:3000/api";
// Global rooms array used by renderRooms()
let rooms = [];
// Selected files for upload (drag-drop or file input)
let selectedFiles = [];

// ======================= HIỂN THỊ DANH SÁCH =======================
function renderRooms() {
  const list = document.getElementById("roomList");
  if (!list) return;

  list.innerHTML = rooms
    .map(
      (room) => `
    <div class="listing-card" onclick="showDetail(this)">
      <div class="card-image" style="position:relative;">
        <img src="${room.img}" alt="">
        ${room.vip ? '<span class="vip-badge">VIP</span>' : ""}
        <span class="photo-count"><i class="fas fa-image"></i> ${
          room.photos
        }</span>
      </div>
      <div class="card-content">
        <h3>${room.title}</h3>
        <div class="price-location">
          <span class="price" style="color:#e74c3c; font-weight:bold; font-size:18px;">${
            room.price
          } triệu</span>
          <span class="location"><i class="fas fa-map-marker-alt"></i> ${
            room.location
          }</span>
        </div>
        <div class="card-footer">
          <span><i class="far fa-clock"></i> ${room.time}</span>
          <span><i class="fas fa-eye"></i> ${room.views} lượt xem</span>
        </div>
      </div>
    </div>
  `
    )
    .join("");
}

function showDetail(element) {
  const room =
    rooms[
      Array.from(document.querySelectorAll(".listing-card")).indexOf(element)
    ];
  const detailTitle = document.getElementById("detailTitle");
  const detailPrice = document.getElementById("detailPrice");
  const detailArea = document.getElementById("detailArea");
  const detailLocation = document.getElementById("detailLocation");
  const detailTime = document.getElementById("detailTime");
  const detailImg = document.getElementById("detailImg");
  const detailModal = document.getElementById("detailModal");

  if (detailTitle) detailTitle.textContent = room.title;
  if (detailPrice) detailPrice.textContent = room.price + " triệu/tháng";
  if (detailArea)
    detailArea.textContent = (room.area || "Chưa cập nhật") + " m²";
  if (detailLocation)
    detailLocation.innerHTML = `<i class="fas fa-map-marker-alt"></i> ${room.location}`;
  if (detailTime)
    detailTime.innerHTML = `<i class="far fa-clock"></i> Cập nhật: ${room.time}`;
  if (detailImg) detailImg.src = room.img;
  if (detailModal) detailModal.style.display = "block";
}

// ======================= HÀM ĐĂNG KÝ =======================
async function register() {
  const name = document.getElementById("regName").value.trim();
  const phone = document.getElementById("regPhone").value.trim();
  const password = document.getElementById("regPass").value.trim();
  const adminCode = document.getElementById("regAdminCode")
    ? document.getElementById("regAdminCode").value.trim()
    : undefined;

  if (!name || !phone || !password) {
    alert("❌ Vui lòng điền đầy đủ thông tin!");
    return;
  }

  if (password.length < 6) {
    alert("❌ Mật khẩu phải có ít nhất 6 ký tự!");
    return;
  }

  try {
    const response = await fetch(`${API}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, phone, password, adminCode }),
    });

    const data = await response.json();

    if (response.ok) {
      alert("✅ Đăng ký thành công! Vui lòng đăng nhập.");
      showLogin();
      document.getElementById("regName").value = "";
      document.getElementById("regPhone").value = "";
      document.getElementById("regPass").value = "";
    } else {
      alert(`❌ Lỗi: ${data.message || "Đăng ký thất bại"}`);
    }
  } catch (error) {
    alert(`❌ Lỗi: ${error.message}`);
  }
}

// ======================= HÀM ĐĂNG NHẬP =======================
async function login() {
  const phone = document.getElementById("loginPhone").value.trim();
  const password = document.getElementById("loginPass").value.trim();

  if (!phone || !password) {
    alert("❌ Vui lòng nhập số điện thoại và mật khẩu!");
    return;
  }

  try {
    const response = await fetch(`${API}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, password }),
    });

    const data = await response.json();

    if (response.ok) {
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      alert("✅ Đăng nhập thành công!");

      // Đóng modal
      const authModal = document.getElementById("authModal");
      if (authModal) {
        authModal.style.display = "none";
      }

      // Reset form
      document.getElementById("loginPhone").value = "";
      document.getElementById("loginPass").value = "";

      // Cập nhật menu
      updateUserMenu();
    } else {
      alert(`❌ Lỗi: ${data.message || "Đăng nhập thất bại"}`);
    }
  } catch (error) {
    alert(`❌ Lỗi: ${error.message}`);
  }
}

// ======================= HÀM ĐĂNG XUẤT =======================
function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  alert("✅ Đã đăng xuất!");

  // Đóng dropdown menu
  const userDropdown = document.querySelector(".user-dropdown");
  if (userDropdown) {
    userDropdown.style.display = "none";
  }

  // Cập nhật menu
  updateUserMenu();

  // Quay về trang chủ
  location.reload();
}

// ======================= CẬP NHẬT MENU NGƯỜI DÙNG =======================
function updateUserMenu() {
  const user = localStorage.getItem("user");
  const guestMenu = document.getElementById("guestMenu");
  const userMenu = document.getElementById("userMenu");
  const userNameEl = document.getElementById("userName");

  if (user && userNameEl && userMenu && guestMenu) {
    try {
      const parsed = JSON.parse(user);
      guestMenu.style.display = "none";
      userMenu.style.display = "block";
      userNameEl.innerHTML = `${
        parsed.name || parsed.phone
      } <i class="fas fa-caret-down"></i>`;
    } catch (e) {
      console.error("❌ Lỗi parse user:", e);
    }
  } else if (guestMenu && userMenu) {
    guestMenu.style.display = "block";
    userMenu.style.display = "none";
  }
}

// ======================= LẤY TIN TỪ BACKEND =======================
async function loadPosts() {
  try {
    const response = await fetch(`${API}/posts`);
    const data = await response.json();

    // Server may return an array or an object { posts: [...] }
    const posts = Array.isArray(data) ? data : data.posts || [];

    // Transform backend posts to `rooms` format expected by renderRooms()
    rooms = posts.map((p) => ({
      img:
        p.photos && p.photos.length > 0
          ? p.photos[0]
          : p.image || "https://via.placeholder.com/400x300",
      photos: p.photos && p.photos.length ? p.photos.length : 1,
      vip: p.vip || false,
      title: p.title || p.address || p.location || "Tin đăng",
      price: p.price || "Thỏa thuận",
      location: p.address || p.location || "",
      time: p.createdAt
        ? new Date(p.createdAt).toLocaleDateString()
        : "Mới đăng",
      views: p.views || 0,
      area: p.area || "",
    }));

    console.log("✅ Tin từ backend:", posts);

    // Render after updating rooms
    renderRooms();
  } catch (error) {
    console.log("⚠️ Không thể kết nối backend:", error.message);
  }
}

// ✅ CHỈ GỌI renderRooms + updateUserMenu + loadPosts KHI DOM SẴN SÀNG
document.addEventListener("DOMContentLoaded", function () {
  renderRooms();
  // Check token validity on load and update UI accordingly
  checkAuthOnLoad().then(() => {
    updateUserMenu();
    loadPosts();
  });

  // Setup dropzone and file input for post images
  const dropZone = document.getElementById("dropZone");
  const fileInput = document.getElementById("postImages");
  const chooseBtn = document.getElementById("chooseFilesBtn");
  const previewContainer = document.getElementById("imagePreview");

  function renderImagePreviews() {
    if (!previewContainer) return;
    previewContainer.innerHTML = "";
    selectedFiles.forEach((file, idx) => {
      const url = URL.createObjectURL(file);
      const img = document.createElement("img");
      img.src = url;
      img.title = file.name;
      previewContainer.appendChild(img);
    });
  }

  if (chooseBtn && fileInput) {
    chooseBtn.addEventListener("click", (e) => {
      e.preventDefault();
      fileInput.click();
    });
  }

  if (fileInput) {
    fileInput.addEventListener("change", (e) => {
      const files = Array.from(e.target.files || []);
      selectedFiles = selectedFiles.concat(files).slice(0, 12);
      renderImagePreviews();
    });
  }

  if (dropZone) {
    ["dragenter", "dragover"].forEach((ev) =>
      dropZone.addEventListener(ev, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropZone.classList.add("dragover");
      })
    );
    ["dragleave", "drop"].forEach((ev) =>
      dropZone.addEventListener(ev, (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (ev === "drop") {
          const files = Array.from(e.dataTransfer.files || []).filter((f) =>
            f.type.startsWith("image/")
          );
          selectedFiles = selectedFiles.concat(files).slice(0, 12);
          renderImagePreviews();
        }
        dropZone.classList.remove("dragover");
      })
    );
  }
});

// Kiểm tra token lưu trong localStorage, nếu hợp lệ thì cập nhật `user`, nếu không thì xóa
async function checkAuthOnLoad() {
  const token = localStorage.getItem("token");
  if (!token) return;

  try {
    const resp = await fetch(`${API}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (resp.ok) {
      const body = await resp.json();
      if (body.user) {
        localStorage.setItem("user", JSON.stringify(body.user));
      }
    } else {
      // Token không hợp lệ hoặc hết hạn
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    }
  } catch (err) {
    console.warn("Không thể xác thực token:", err.message);
    // Không xóa localStorage ở lỗi mạng — để người dùng thử lại
  }
}

// 📌 XỬ LÝ CLICK TIM YÊU THÍCH (KHÔNG CAN THIỆP VÀO MODAL!)
document.addEventListener("click", function (e) {
  // ✅ CHỈ xử lý icon tim, không xử lý toàn bộ document
  if (e.target.closest(".like-btn")) {
    const likeBtn = e.target.closest(".like-btn");
    likeBtn.classList.toggle("liked");
    if (likeBtn.classList.contains("liked")) {
      likeBtn.style.color = "#e74c3c";
    } else {
      likeBtn.style.color = "#ccc";
    }
  }
});

// ======================= ĐĂNG NHẬP BẰNG EMAIL (GMAIL) =======================
function loginEmail() {
  alert("⏳ Chức năng đăng nhập Gmail sẽ sớm được cập nhật!");
  // TODO: Integrate Google OAuth 2.0
  // Khi integrate, dùng: gapi.auth2.getAuthInstance().signIn()
}

// ======================= ĐĂNG NHẬP BẰNG FACEBOOK =======================
function loginFacebook() {
  alert("⏳ Chức năng đăng nhập Facebook sẽ sớm được cập nhật!");
  // TODO: Integrate Facebook SDK
  // Khi integrate, dùng: FB.login()
}

// ======================= GỬI OTP VỀ EMAIL/SĐT =======================
async function sendOTP() {
  const phoneEmail = document.getElementById("forgotPhoneEmail").value.trim();

  if (!phoneEmail) {
    alert("❌ Vui lòng nhập số điện thoại hoặc email!");
    return;
  }

  try {
    const response = await fetch(`${API}/auth/send-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phoneEmail }),
    });

    const data = await response.json();

    if (response.ok) {
      alert("✅ Mã OTP đã được gửi! Vui lòng kiểm tra email hoặc SMS.");
      // Lưu thông tin tạm thời
      localStorage.setItem("forgotPhoneEmail", phoneEmail);
      document.getElementById("otpSection").style.display = "block";
    } else {
      alert(`❌ Lỗi: ${data.message || "Không tìm thấy tài khoản"}`);
    }
  } catch (error) {
    alert(`❌ Lỗi: ${error.message}`);
  }
}

// ======================= GỬI LẠI MÃ OTP =======================
async function resendOTP() {
  const phoneEmail = localStorage.getItem("forgotPhoneEmail");

  if (!phoneEmail) {
    alert("❌ Vui lòng nhập số điện thoại hoặc email trước!");
    return;
  }

  try {
    const response = await fetch(`${API}/auth/send-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phoneEmail }),
    });

    const data = await response.json();

    if (response.ok) {
      alert("✅ Mã OTP mới đã được gửi!");
    } else {
      alert(`❌ Lỗi: ${data.message || "Gửi lại thất bại"}`);
    }
  } catch (error) {
    alert(`❌ Lỗi: ${error.message}`);
  }
}

// ======================= RESET MẬT KHẨU =======================
async function resetPassword() {
  const phoneEmail = localStorage.getItem("forgotPhoneEmail");
  const otp = document.getElementById("otpCode").value.trim();
  const newPass = document.getElementById("newPass").value.trim();
  const confirmNewPass = document.getElementById("confirmNewPass").value.trim();

  if (!otp || !newPass || !confirmNewPass) {
    alert("❌ Vui lòng điền đầy đủ thông tin!");
    return;
  }

  if (otp.length !== 6) {
    alert("❌ Mã OTP phải có 6 chữ số!");
    return;
  }

  if (newPass.length < 6) {
    alert("❌ Mật khẩu mới phải có ít nhất 6 ký tự!");
    return;
  }

  if (newPass !== confirmNewPass) {
    alert("❌ Mật khẩu mới không khớp!");
    return;
  }

  try {
    const response = await fetch(`${API}/auth/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phoneEmail, otp, newPassword: newPass }),
    });

    const data = await response.json();

    if (response.ok) {
      alert("✅ Đặt lại mật khẩu thành công! Vui lòng đăng nhập.");
      localStorage.removeItem("forgotPhoneEmail");

      // Reset form
      document.getElementById("forgotPhoneEmail").value = "";
      document.getElementById("otpCode").value = "";
      document.getElementById("newPass").value = "";
      document.getElementById("confirmNewPass").value = "";
      document.getElementById("otpSection").style.display = "none";

      // Quay về form đăng nhập
      showLogin();
    } else {
      alert(`❌ Lỗi: ${data.message || "Đặt lại mật khẩu thất bại"}`);
    }
  } catch (error) {
    alert(`❌ Lỗi: ${error.message}`);
  }
}

// ======================= GỬI MẬT KHẨU MỚI VỀ SMS =======================
async function sendNewPassword() {
  const phone = document.getElementById("forgotPhone").value.trim();

  if (!phone) {
    alert("❌ Vui lòng nhập số điện thoại!");
    return;
  }

  if (!/^\d{10,11}$/.test(phone)) {
    alert("❌ Số điện thoại không hợp lệ!");
    return;
  }

  try {
    const response = await fetch(`${API}/auth/send-new-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone }),
    });

    const data = await response.json();

    if (response.ok) {
      // Hiển thị thông báo thành công
      const resultMsg = document.getElementById("resultMessage");
      const resultText = document.getElementById("resultText");

      resultText.textContent = `✅ ${data.message}\n📱 Mật khẩu mới đã được gửi đến: ${phone}`;
      resultMsg.style.display = "block";

      // Reset form sau 3 giây
      setTimeout(() => {
        document.getElementById("forgotPhone").value = "";
        resultMsg.style.display = "none";
        showLogin();
      }, 3000);
    } else {
      alert(`❌ Lỗi: ${data.message || "Không tìm thấy tài khoản"}`);
    }
  } catch (error) {
    alert(`❌ Lỗi: ${error.message}`);
  }
}

// ======================= BƯỚC 1: GỬI OTP =======================
async function requestOTP() {
  const phone = document.getElementById("forgotPhone").value.trim();

  if (!phone) {
    alert("❌ Vui lòng nhập số điện thoại!");
    return;
  }

  try {
    const response = await fetch(`${API}/auth/send-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone }),
    });

    const data = await response.json();

    if (response.ok) {
      // Ẩn bước 1, hiện bước 2
      document.getElementById("step1Forgot").style.display = "none";
      document.getElementById("step2Forgot").style.display = "block";

      // Hiển thị thông báo
      const msg = document.getElementById("forgotMessage");
      const msgText = document.getElementById("forgotMessageText");
      msgText.textContent =
        "📌 OTP đã được gửi! Kiểm tra console của server để xem mã OTP (dành cho giảng viên kiểm tra).";
      msg.style.display = "block";

      // Lưu số điện thoại tạm thời
      sessionStorage.setItem("resetPhone", phone);
    } else {
      alert(`❌ Lỗi: ${data.message}`);
    }
  } catch (error) {
    alert(`❌ Lỗi: ${error.message}`);
  }
}

// ======================= BƯỚC 2: XÁC THỰC OTP & ĐỔI MẬT KHẨU =======================
async function verifyOTPAndReset() {
  const phone = sessionStorage.getItem("resetPhone");
  const otp = document.getElementById("otpCode").value.trim();
  const newPassword = document.getElementById("newPassword").value.trim();
  const confirmPassword = document
    .getElementById("confirmPassword")
    .value.trim();

  if (!otp || !newPassword || !confirmPassword) {
    alert("❌ Vui lòng điền đầy đủ thông tin!");
    return;
  }

  if (otp.length !== 6 || !/^\d+$/.test(otp)) {
    alert("❌ Mã OTP phải có 6 chữ số!");
    return;
  }

  if (newPassword.length < 6) {
    alert("❌ Mật khẩu mới phải có ít nhất 6 ký tự!");
    return;
  }

  if (newPassword !== confirmPassword) {
    alert("❌ Mật khẩu không khớp!");
    return;
  }

  try {
    const response = await fetch(`${API}/auth/verify-otp-and-reset`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, otp, newPassword }),
    });

    const data = await response.json();

    if (response.ok) {
      alert("✅ " + data.message);

      // Reset form
      document.getElementById("forgotPhone").value = "";
      document.getElementById("otpCode").value = "";
      document.getElementById("newPassword").value = "";
      document.getElementById("confirmPassword").value = "";
      sessionStorage.removeItem("resetPhone");
      document.getElementById("forgotMessage").style.display = "none";

      // Quay về form đăng nhập
      showLogin();
    } else {
      alert(`❌ Lỗi: ${data.message}`);
    }
  } catch (error) {
    alert(`❌ Lỗi: ${error.message}`);
  }
}

// ======================= HIỂN THỊ FORM QUÊN MẬT KHẨU =======================
function showForgot() {
  document.getElementById("loginForm").style.display = "none";
  document.getElementById("registerForm").style.display = "none";
  document.getElementById("forgotForm").style.display = "block";

  document.getElementById("tabForgot").style.background = "#3498db";
  document.getElementById("tabForgot").style.color = "white";
  document.getElementById("tabLogin").style.background = "#f0f0f0";
  document.getElementById("tabLogin").style.color = "#333";
  document.getElementById("tabRegister").style.background = "#f0f0f0";
  document.getElementById("tabRegister").style.color = "#333";

  // Reset form
  document.getElementById("step1Forgot").style.display = "block";
  document.getElementById("step2Forgot").style.display = "none";
  document.getElementById("forgotPhone").value = "";
  document.getElementById("otpCode").value = "";
  document.getElementById("newPassword").value = "";
  document.getElementById("confirmPassword").value = "";
  document.getElementById("forgotMessage").style.display = "none";
  sessionStorage.removeItem("resetPhone");
}
// ======================= GỬI FORM ĐĂNG TIN =======================
async function submitPost() {
  const title = document.getElementById("postTitle").value.trim();
  const address = document.getElementById("postAddress").value.trim();
  const price = document.getElementById("postPrice").value.trim();
  const area = document.getElementById("postArea").value.trim();
  const desc = document.getElementById("postDesc").value.trim();

  // Kiểm tra bắt buộc
  if (!title || !address || !price || !area) {
    alert("❌ Vui lòng điền đầy đủ thông tin bắt buộc!");
    return;
  }

  if (isNaN(price) || isNaN(area)) {
    alert("❌ Giá và diện tích phải là số!");
    return;
  }

  try {
    const token = localStorage.getItem("token");

    const form = new FormData();
    form.append("title", title);
    form.append("address", address);
    form.append("price", parseFloat(price));
    form.append("area", parseFloat(area));
    form.append("description", desc);

    // Append images (selectedFiles filled from dropzone/file input)
    if (selectedFiles && selectedFiles.length > 0) {
      selectedFiles.forEach((f) => form.append("images", f));
    } else {
      // fallback placeholder image url
      form.append(
        "image",
        "https://via.placeholder.com/400x300?text=" + encodeURIComponent(title)
      );
    }

    const response = await fetch(`${API}/posts/create`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: form,
    });

    const data = await response.json();

    if (response.ok) {
      alert("✅ Đăng tin thành công!");

      // Reset form
      document.getElementById("postTitle").value = "";
      document.getElementById("postAddress").value = "";
      document.getElementById("postPrice").value = "";
      document.getElementById("postArea").value = "";
      document.getElementById("postDesc").value = "";
      const fileInput = document.getElementById("postImages");
      if (fileInput) fileInput.value = "";
      selectedFiles = [];
      const preview = document.getElementById("imagePreview");
      if (preview) preview.innerHTML = "";

      // Đóng modal
      document.getElementById("postModal").style.display = "none";

      // Reload danh sách tin
      await loadPosts();
      renderRooms();
    } else {
      alert(`❌ Lỗi: ${data.message || "Đăng tin thất bại"}`);
    }
  } catch (error) {
    alert(`❌ Lỗi: ${error.message}`);
  }
}

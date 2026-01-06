const API = "https://baitapjlonwebchothue.onrender.com/api";
let rooms = [];
let allPostsRaw = [];
let filteredRoomsCache = [];
let currentPage = 1;
const PAGE_SIZE = 20;
let selectedFiles = [];
let currentFilterLetter = "";

function updateImageCount() {
  const el = document.getElementById("imageCount");
  if (el) el.textContent = selectedFiles.length;
}

// ==================== MODAL HANDLERS ====================
document.addEventListener("DOMContentLoaded", function () {
  // Header luôn cố định, chỉ ẩn/hiện search-section khi cuộn lên/xuống
  let lastScrollY = window.scrollY;
  const searchSection = document.getElementById("searchSection");
  function handleScroll() {
    if (!searchSection) return;
    if (window.scrollY > lastScrollY && window.scrollY > 80) {
      // Cuộn xuống, ẩn search-section
      searchSection.classList.add("hide-on-scroll");
    } else if (window.scrollY < lastScrollY) {
      // Cuộn lên, hiện search-section ngay lập tức
      searchSection.classList.remove("hide-on-scroll");
    }
    lastScrollY = window.scrollY;
  }
  window.addEventListener("scroll", handleScroll);
  window.addEventListener("resize", handleScroll);
  handleScroll();
  // Modal tabs handler
  const modalTabs = document.querySelectorAll(".modal-tab");
  modalTabs.forEach((tab) => {
    tab.addEventListener("click", function () {
      const tabName = this.getAttribute("data-tab");
      const modal = this.closest(".modal");

      // Remove active from all tabs
      modal
        .querySelectorAll(".modal-tab")
        .forEach((t) => t.classList.remove("active"));
      modal
        .querySelectorAll(".modal-form")
        .forEach((f) => f.classList.remove("active"));

      // Add active to clicked tab
      this.classList.add("active");
      const form = modal.querySelector("#" + tabName + "Form");
      if (form) form.classList.add("active");
    });
  });

  // Auth link handler
  const loginLink = document.getElementById("loginLink");
  if (loginLink) {
    loginLink.addEventListener("click", function (e) {
      e.preventDefault();
      openAuthModal("login");
    });
  }

  const registerLink = document.getElementById("registerLink");
  if (registerLink) {
    registerLink.addEventListener("click", function (e) {
      e.preventDefault();
      openAuthModal("register");
    });
  }

  // Auth status / debug button
  const authStatusBtn = document.getElementById("authStatusBtn");
  if (authStatusBtn) {
    authStatusBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      const token = localStorage.getItem("token");
      const user = localStorage.getItem("user");
      if (!token) {
        alert("Chưa đăng nhập. LocalStorage.user not found.");
        return;
      }
      try {
        const resp = await fetch(`${API}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!resp.ok) {
          const err = await resp.json().catch(() => ({}));
          alert("Token không hợp lệ: " + (err.message || resp.statusText));
          return;
        }
        const body = await resp.json();
        alert("Đã xác thực: " + JSON.stringify(body.user || body));
      } catch (err) {
        alert("Lỗi kết nối tới server: " + (err.message || err));
      }
    });
  }

  // Post button handler
  const postBtn = document.getElementById("postBtn");
  if (postBtn) {
    postBtn.addEventListener("click", openPostModal);
  }

  // Close modals when clicking backdrop
  const modals = document.querySelectorAll(".modal");
  modals.forEach((modal) => {
    modal.addEventListener("click", function (e) {
      if (e.target === this) {
        closeModal(this);
      }
    });
  });

  // Dropzone handler
  const dropZone = document.getElementById("dropZone");
  if (dropZone) {
    dropZone.addEventListener("dragover", (e) => {
      e.preventDefault();
      dropZone.style.background = "rgba(231, 76, 60, 0.1)";
    });

    dropZone.addEventListener("dragleave", () => {
      dropZone.style.background = "";
    });

    dropZone.addEventListener("drop", (e) => {
      e.preventDefault();
      const files = e.dataTransfer.files;
      handleFilesSelect(files);
    });
  }

  // File input handler
  const postImages = document.getElementById("postImages");
  if (postImages) {
    postImages.addEventListener("change", function () {
      handleFilesSelect(this.files);
    });
  }

  // Update header based on login state (hide post button by default; only admins see it)
  try {
    const storedUser = localStorage.getItem("user");
    const token = localStorage.getItem("token");
    const guestMenu = document.getElementById("guestMenu");
    const userMenu = document.getElementById("userMenu");
    const postBtn = document.getElementById("postBtn");

    if (storedUser && token) {
      const u = JSON.parse(storedUser);
      if (userMenu) {
        userMenu.style.display = "flex";
        const nameEl = document.getElementById("userName");
        if (nameEl)
          nameEl.textContent = u.name || u.fullname || u.phone || "Người dùng";
      }
      if (guestMenu) guestMenu.style.display = "none";
      if (postBtn)
        postBtn.style.display = u.role === "admin" ? "inline-flex" : "none";
    } else {
      if (guestMenu) guestMenu.style.display = "flex";
      if (userMenu) userMenu.style.display = "none";
      if (postBtn) postBtn.style.display = "none";
    }
  } catch (e) {
    console.warn("Error updating header state", e);
  }
});

function openAuthModal() {
  const tab = arguments.length && arguments[0] ? arguments[0] : "login";
  const modal = document.getElementById("authModal");
  if (modal) {
    modal.classList.add("active");
    modal.style.display = "flex";
    // activate requested tab
    const tabBtn = modal.querySelector(`.modal-tab[data-tab="${tab}"]`);
    if (tabBtn) tabBtn.click();
  }
}

function closeAuthModal() {
  const modal = document.getElementById("authModal");
  if (modal) {
    modal.classList.remove("active");
    modal.style.display = "none";
  }
}

function closeDetailModal() {
  const modal = document.getElementById("detailModal");
  if (modal) {
    modal.classList.remove("active");
    modal.style.display = "none";
  }
}

function callPhone() {
  const phoneEl = document.getElementById("detailPhone");
  const phone = phoneEl ? phoneEl.textContent : "0344886556";
  window.open(`tel:${phone}`, "_blank");
}

function openPostModal() {
  const user = localStorage.getItem("user");
  const token = localStorage.getItem("token");

  if (!user || !token) {
    alert("Vui lòng đăng nhập để đăng tin");
    openAuthModal();
    return;
  }

  const modal = document.getElementById("postModal");
  if (modal) {
    modal.classList.add("active");
    modal.style.display = "flex";
  }
}

function closePostModal() {
  const modal = document.getElementById("postModal");
  if (modal) {
    modal.classList.remove("active");
    modal.style.display = "none";
  }
}

function closeModal(modal) {
  modal.classList.remove("active");
  modal.style.display = "none";
}

function handleFilesSelect(files) {
  // Chỉ lấy file mới, không nối thêm, fix bug lặp ảnh
  selectedFiles = Array.from(files || []).slice(0, 12);
  const preview = document.getElementById("imagePreview");
  if (preview) {
    preview.innerHTML = selectedFiles
      .map(
        (file, index) => `
            <div class="image-preview">
                <img src="${URL.createObjectURL(file)}" alt="Preview ${
          index + 1
        }">
                <button type="button" class="img-remove-btn" onclick="removeImage(${index})">×</button>
            </div>
        `
      )
      .join("");
  }
  updateImageCount();
}

function removeImage(index) {
  selectedFiles.splice(index, 1);
  const preview = document.getElementById("imagePreview");
  if (preview) {
    preview.innerHTML = selectedFiles
      .map(
        (file, i) => `
            <div class="image-preview">
                <img src="${URL.createObjectURL(file)}" alt="Preview ${i + 1}">
                <button type="button" class="img-remove-btn" onclick="removeImage(${i})">×</button>
            </div>
        `
      )
      .join("");
  }
  updateImageCount();
}

// (Consolidated auth functions are defined later in the file)

// ======================= HIỂN THỊ DANH SÁCH =======================
function renderRooms() {
  const list = document.getElementById("roomList");
  if (!list) return;

  // apply alphabet filter if set
  const filtered = currentFilterLetter
    ? rooms.filter((r) => {
        const title = (r.title || "")
          .normalize("NFD")
          .replace(/\p{Diacritic}/gu, "");
        return title.charAt(0).toUpperCase() === currentFilterLetter;
      })
    : rooms;

  list.innerHTML = filtered
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

// Apply UI filters + keyword search and render
function applyFilters(page = 1) {
  const kw = (document.getElementById("search")?.value || "")
    .trim()
    .toLowerCase();
  const model = document.getElementById("modelFilter")?.value || "";
  const district = document.getElementById("districtFilter")?.value || "";
  const area = document.getElementById("areaFilter")?.value || "";
  const price = document.getElementById("priceFilter")?.value || "";

  console.log("🔍 Filtering:", {
    kw,
    model,
    district,
    area,
    price,
    totalRooms: rooms.length,
  });

  const filtered = rooms.filter((r) => {
    // keyword in title or location
    if (kw) {
      const hay = (r.title + " " + (r.location || "")).toLowerCase();
      if (!hay.includes(kw)) return false;
    }
    if (model) {
      if ((r.rentalModel || "") !== model) return false;
    }
    if (district) {
      if ((r.district || "") !== district) return false;
    }
    if (area) {
      const a = Number(r.area) || 0;
      if (area === "lt30" && !(a < 30)) return false;
      if (area === "lt50" && !(a < 50)) return false;
      if (area === "lt100" && !(a < 100)) return false;
      if (area === "gt50" && !(a > 50)) return false;
      if (area === "gte100" && !(a >= 100)) return false;
    }
    if (price) {
      const p =
        Number((r.price || "").toString().replace(/[^0-9\.]/g, "")) || 0;
      if (price === "lt5" && !(p < 5)) return false;
      if (price === "lt10" && !(p < 10)) return false;
      if (price === "lt30" && !(p < 30)) return false;
      if (price === "lt50" && !(p < 50)) return false;
      if (price === "lt100" && !(p < 100)) return false;
      if (price === "gt100" && !(p > 100)) return false;
    }
    return true;
  });

  filteredRoomsCache = filtered;
  currentPage = page;
  console.log(
    "✅ Filtered results:",
    filtered.length,
    "items from",
    rooms.length
  );
  renderPage();
}

function resetFilters() {
  document.getElementById("search").value = "";
  document.getElementById("modelFilter").value = "";
  document.getElementById("districtFilter").value = "";
  document.getElementById("areaFilter").value = "";
  document.getElementById("priceFilter").value = "";
  applyFilters(1);
}

// Filter by rental model from menu
function filterByModel(model) {
  document.getElementById("modelFilter").value = model;
  document.getElementById("search").value = "";
  document.getElementById("districtFilter").value = "";
  document.getElementById("areaFilter").value = "";
  document.getElementById("priceFilter").value = "";
  applyFilters(1);
}

// Dropdown lọc mô hình ở header
document.querySelectorAll(".model-dropdown .dropdown-item").forEach((item) => {
  item.addEventListener("click", function () {
    const type = this.getAttribute("data-type");
    filterByModel(type);
  });
});

function filterByModel(model) {
  // allPostsRaw là mảng chứa toàn bộ tin đăng đã fetch từ backend
  let filtered = [];
  if (model) {
    filtered = allPostsRaw.filter(
      (post) =>
        post.modelType === model ||
        post.model === model ||
        post["mô hình"] === model
    );
  } else {
    filtered = allPostsRaw;
  }
  // renderPosts là hàm hiển thị tin đăng, thay bằng hàm thực tế của bạn
  renderPosts(filtered);
}

function renderPage() {
  const list = document.getElementById("roomList");
  if (!list) return;
  const total = filteredRoomsCache.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  if (currentPage > totalPages) currentPage = totalPages;
  const start = (currentPage - 1) * PAGE_SIZE;
  const pageItems = filteredRoomsCache.slice(start, start + PAGE_SIZE);

  list.innerHTML = pageItems
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
          } ${room.district ? " - " + room.district : ""}</span>
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

  renderPaginationControls(total, totalPages);
}

function renderPaginationControls(totalItems, totalPages) {
  let pagination = document.getElementById("paginationControls");
  if (!pagination) {
    pagination = document.createElement("div");
    pagination.id = "paginationControls";
    pagination.style = "text-align:center; margin:18px 0;";
    const container = document.querySelector(".container");
    if (container) container.appendChild(pagination);
  }

  if (totalPages <= 1) {
    pagination.innerHTML = "";
    return;
  }

  // build number buttons
  const pages = [];
  for (let i = 1; i <= totalPages; i++) pages.push(i);

  pagination.innerHTML = pages
    .map(
      (p) =>
        `<button class="page-btn" data-page="${p}" style="margin:0 6px;padding:8px 12px;border-radius:6px;border:1px solid #ddd;background:${
          p === currentPage ? "#e74c3c" : "white"
        };color:${
          p === currentPage ? "white" : "#333"
        };cursor:pointer">${p}</button>`
    )
    .join("");

  pagination.querySelectorAll(".page-btn").forEach((b) => {
    b.onclick = () => {
      const p = Number(b.getAttribute("data-page"));
      currentPage = p;
      renderPage();
      window.scrollTo({ top: 200, behavior: "smooth" });
    };
  });
}

// Build alphabet bar (A-Z + Tất cả)
function buildAlphabetBar() {
  const container = document.getElementById("alphabetBar");
  if (!container) return;
  const letters = ["Tất cả"];
  for (let i = 65; i <= 90; i++) letters.push(String.fromCharCode(i));
  container.innerHTML = letters
    .map((l) => {
      const data = l === "Tất cả" ? "" : l;
      const cls = l === "Tất cả" ? "alpha-btn active" : "alpha-btn";
      return `<button class="${cls}" data-letter="${data}">${l}</button>`;
    })
    .join("");

  container.addEventListener("click", (e) => {
    const btn = e.target.closest(".alpha-btn");
    if (!btn) return;
    // remove active
    container
      .querySelectorAll(".alpha-btn")
      .forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    const letter = btn.getAttribute("data-letter") || "";
    currentFilterLetter = letter;
    renderRooms();
  });
}

function showDetail(element) {
  const room =
    rooms[
      Array.from(document.querySelectorAll(".listing-card")).indexOf(element)
    ];

  // Debug: kiểm tra dữ liệu room
  console.log("Room data:", room);

  const detailTitle = document.getElementById("detailTitle");
  const detailPrice = document.getElementById("detailPrice");
  const detailArea = document.getElementById("detailArea");
  const detailLocation = document.getElementById("detailLocation");
  const detailTime = document.getElementById("detailTime");
  const detailImg = document.getElementById("detailImg");
  const detailDesc = document.getElementById("detailDesc");
  const detailModal = document.getElementById("detailModal");

  if (detailTitle) detailTitle.textContent = room.title;
  if (detailPrice) detailPrice.textContent = room.price + " triệu/tháng";
  if (detailArea)
    detailArea.textContent = (room.area || "Chưa cập nhật") + " m²";
  if (detailLocation)
    detailLocation.innerHTML = `<i class="fas fa-map-marker-alt"></i> ${room.location}`;
  if (detailTime)
    detailTime.innerHTML = `<i class="far fa-clock"></i> Cập nhật: ${room.time}`;

  // Hiển thị ảnh: ưu tiên images array, sau đó img, cuối cùng placeholder
  if (detailImg) {
    if (room.images && Array.isArray(room.images) && room.images.length > 0) {
      console.log("Hiển thị ảnh từ images array:", room.images[0]);
      detailImg.src = room.images[0];
    } else if (room.img) {
      console.log("Hiển thị ảnh từ img:", room.img);
      detailImg.src = room.img;
    } else {
      console.log("Không có ảnh, dùng placeholder");
      detailImg.src =
        "https://via.placeholder.com/700x400?text=Kh%C3%B4ng+c%C3%B3+h%C3%ACnh+%E1%BA%A3nh";
    }
  }

  // Hiển thị mô tả
  if (detailDesc) {
    const description =
      room.description || room.desc || "Chưa có mô tả chi tiết";
    console.log("Mô tả:", description);
    detailDesc.textContent = description;
  }

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

  const errEl = document.getElementById("registerError");
  if (errEl) {
    errEl.style.display = "none";
    errEl.textContent = "";
  }
  try {
    const response = await fetch(`${API}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, phone, password, adminCode }),
    });

    const data = await response.json();

    if (response.ok) {
      showLogin();
      document.getElementById("regName").value = "";
      document.getElementById("regPhone").value = "";
      document.getElementById("regPass").value = "";
      if (document.getElementById("regAdminCode")) {
        document.getElementById("regAdminCode").value = "";
      }
      alert("Đăng ký thành công! Vui lòng đăng nhập.");
    } else {
      if (errEl) {
        errEl.style.display = "block";
        errEl.textContent = data.message || "Đăng ký thất bại";
      } else {
        alert(`Lỗi: ${data.message || "Đăng ký thất bại"}`);
      }
    }
  } catch (error) {
    if (errEl) {
      errEl.style.display = "block";
      errEl.textContent = error.message || "Lỗi mạng";
    } else {
      alert(`Lỗi: ${error.message}`);
    }
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

  const errEl = document.getElementById("loginError");
  if (errEl) {
    errEl.style.display = "none";
    errEl.textContent = "";
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

      // verify token with /auth/me (optional, gives clearer error)
      try {
        const me = await fetch(`${API}/auth/me`, {
          headers: { Authorization: `Bearer ${data.token}` },
        });
        if (!me.ok) {
          // token invalid on server
          throw new Error("Token không hợp lệ");
        }
      } catch (e) {
        if (errEl) {
          errEl.style.display = "block";
          errEl.textContent = e.message || "Lỗi xác thực";
        }
        return;
      }

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
      if (errEl) {
        errEl.style.display = "block";
        errEl.textContent = data.message || "Đăng nhập thất bại";
      } else {
        alert(`Lỗi: ${data.message || "Đăng nhập thất bại"}`);
      }
    }
  } catch (error) {
    if (errEl) {
      errEl.style.display = "block";
      errEl.textContent = error.message || "Lỗi mạng";
    } else {
      alert(`Lỗi: ${error.message}`);
    }
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
      // add role badge
      const existingBadge = document.querySelector(".role-badge");
      if (existingBadge) existingBadge.remove();
      const span = document.createElement("span");
      span.className = "role-badge";
      span.textContent = parsed.role || "user";
      userNameEl.parentElement.insertBefore(span, userNameEl.nextSibling);
      // Show/hide post button based on role
      const postBtn = document.querySelector(".post-btn");
      if (postBtn) {
        postBtn.style.display =
          parsed.role === "admin" ? "inline-block" : "none";
      }

      // If admin, add "Thêm admin" entry to user dropdown (avoid duplicates)
      const userDropdown =
        userNameEl.parentElement.querySelector(".user-dropdown");
      if (userDropdown) {
        // remove existing admin link if any
        const existingAddAdmin = userDropdown.querySelector(".add-admin-link");
        if (existingAddAdmin) existingAddAdmin.remove();
        if (parsed.role === "admin") {
          const a = document.createElement("a");
          a.href = "#";
          a.className = "add-admin-link";
          a.innerHTML = '<i class="fas fa-user-shield"></i> Thêm admin';
          a.onclick = (ev) => {
            ev.preventDefault();
            createAdmin();
          };
          // insert at top
          userDropdown.insertBefore(a, userDropdown.firstChild);
        }
      }
    } catch (e) {
      console.error("❌ Lỗi parse user:", e);
    }
  } else if (guestMenu && userMenu) {
    guestMenu.style.display = "block";
    userMenu.style.display = "none";
    const postBtn = document.querySelector(".post-btn");
    if (postBtn) postBtn.style.display = "none";
  }
}

// ======================= TẠO ADMIN (giao diện nhanh) =======================
async function createAdmin() {
  try {
    const name = prompt("Tên admin mới (ví dụ: Nguyễn Văn A)");
    if (!name) return alert("Hủy tạo admin.");
    const phone = prompt("Số điện thoại admin (ví dụ: 0987654321)");
    if (!phone) return alert("Hủy tạo admin.");
    const password = prompt("Mật khẩu cho admin (tối thiểu 6 ký tự)");
    if (!password || password.length < 6)
      return alert("Mật khẩu phải có ít nhất 6 ký tự.");

    const token = localStorage.getItem("token");
    if (!token)
      return alert("Bạn phải đăng nhập với tài khoản admin để tạo admin khác.");

    const resp = await fetch(`${API}/auth/create-admin`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token,
      },
      body: JSON.stringify({ name, phone, password }),
    });

    const result = await resp.json();
    if (resp.ok) {
      alert("✅ Tạo admin thành công: " + phone);
    } else {
      alert("❌ Lỗi: " + (result.message || "Tạo admin thất bại"));
    }
  } catch (err) {
    console.error("Create admin error:", err);
    alert("❌ Lỗi mạng: " + (err.message || err));
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
      images: p.photos || (p.image ? [p.image] : []),
      photos: p.photos && p.photos.length ? p.photos.length : 1,
      vip: p.vip || false,
      title: p.title || p.address || p.location || "Tin đăng",
      price: p.price || "Thỏa thuận",
      location: p.address || p.location || "",
      district: p.district || "",
      rentalModel: p.rentalModel || "",
      description: p.description || p.desc || "Chưa có mô tả chi tiết",
      time: p.createdAt
        ? new Date(p.createdAt).toLocaleDateString()
        : "Mới đăng",
      views: p.views || 0,
      area: p.area || "",
    }));

    console.log("✅ Tin từ backend:", posts);

    // Log chi tiết từng bài viết
    posts.forEach((p, i) => {
      console.log(`Bài ${i + 1}:`, {
        title: p.title,
        district: p.district,
        rentalModel: p.rentalModel,
        price: p.price,
      });
    });

    // Render after updating rooms
    applyFilters();
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

  // build alphabet filter
  buildAlphabetBar();

  // Sticky header+search-section hide on scroll down, show on scroll up
  let lastScrollY2 = window.scrollY;
  const stickyHeaderWrap = document.getElementById("stickyHeaderWrap");
  function handleStickyHeader() {
    if (!stickyHeaderWrap) return;
    if (window.scrollY > lastScrollY2 && window.scrollY > 120) {
      stickyHeaderWrap.classList.add("sticky-hide");
    } else {
      stickyHeaderWrap.classList.remove("sticky-hide");
    }
    lastScrollY2 = window.scrollY;
  }
  window.addEventListener("scroll", handleStickyHeader);

  // Category click filter logic
  document
    .getElementById("cat-nhanguyencan")
    ?.addEventListener("click", function (e) {
      e.preventDefault();
      filterByModel("Nhà Đất cho thuê");
    });
  document
    .getElementById("cat-chungcu")
    ?.addEventListener("click", function (e) {
      e.preventDefault();
      // Lọc các tin có modelType chứa "chung cư" hoặc "căn hộ"
      const filtered = allPostsRaw.filter((post) => {
        const m = (
          post.modelType ||
          post.model ||
          post["mô hình"] ||
          ""
        ).toLowerCase();
        return m.includes("chung cư") || m.includes("căn hộ");
      });
      renderPosts(filtered);
    });
  document
    .getElementById("cat-matbang")
    ?.addEventListener("click", function (e) {
      e.preventDefault();
      // Lọc các tin có modelType là "mặt bằng cho thuê" hoặc "sang nhượng mặt bằng"
      const filtered = allPostsRaw.filter((post) => {
        const m = (
          post.modelType ||
          post.model ||
          post["mô hình"] ||
          ""
        ).toLowerCase();
        return m === "mặt bằng cho thuê" || m === "sang nhượng mặt bằng";
      });
      renderPosts(filtered);
    });
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
// Hiển thị form đăng nhập (tab)
function showLogin() {
  const loginForm = document.getElementById("loginForm");
  const registerForm = document.getElementById("registerForm");
  const forgotForm = document.getElementById("forgotForm");
  if (loginForm) loginForm.style.display = "block";
  if (registerForm) registerForm.style.display = "none";
  if (forgotForm) forgotForm.style.display = "none";

  const tabLogin = document.getElementById("tabLogin");
  const tabRegister = document.getElementById("tabRegister");
  const tabForgot = document.getElementById("tabForgot");
  if (tabLogin) {
    tabLogin.style.background = "#3498db";
    tabLogin.style.color = "white";
  }
  if (tabRegister) {
    tabRegister.style.background = "#f0f0f0";
    tabRegister.style.color = "#333";
  }
  if (tabForgot) {
    tabForgot.style.background = "#f0f0f0";
    tabForgot.style.color = "#333";
  }
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
    const district = document.getElementById("postDistrict")
      ? document.getElementById("postDistrict").value
      : "";
    const rentalModel = document.getElementById("postRentalModel")
      ? document.getElementById("postRentalModel").value
      : "";
    form.append("price", parseFloat(price));
    form.append("area", parseFloat(area));
    form.append("description", desc);
    form.append("district", district);
    form.append("rentalModel", rentalModel);

    console.log("📝 Gửi đăng tin với:", {
      title,
      district,
      rentalModel,
      price,
      area,
    });

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
      console.log("💾 Bài viết lưu:", {
        district: data.post?.district,
        rentalModel: data.post?.rentalModel,
      });

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
      applyFilters();
    } else {
      alert(`❌ Lỗi: ${data.message || "Đăng tin thất bại"}`);
    }
  } catch (error) {
    alert(`❌ Lỗi: ${error.message}`);
  }
}

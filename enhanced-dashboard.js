// Enhanced Dashboard JavaScript - BrainSAIT Digital Insurance Platform
// Author: BrainSAIT Digital Solutions
// Version: 1.2.0

class BrainSAITDashboard {
  constructor() {
    this.apiBase = this.getApiBase();
    this.currentLanguage = localStorage.getItem("language") || "en";
    this.currentTheme = localStorage.getItem("theme") || "light";
    this.refreshInterval = null;
    this.charts = {};
    this.socket = null;
    this.translations = {};

    // Configuration
    this.config = {
      refreshInterval: 30000, // 30 seconds
      maxRetries: 3,
      retryDelay: 2000,
      toastDuration: 5000,
      cacheTimeout: 5 * 60 * 1000, // 5 minutes
    };

    // Cache for API responses
    this.cache = new Map();

    // Bind methods
    this.loadDashboard = this.loadDashboard.bind(this);
    this.loadTenants = this.loadTenants.bind(this);
    this.loadClaims = this.loadClaims.bind(this);
  }

  // Initialize dashboard
  async initializeDashboard() {
    try {
      console.log("🚀 Initializing BrainSAIT Dashboard...");

      // Load translations
      await this.loadTranslations(this.currentLanguage);

      // Initialize authentication
      await this.initializeAuth();

      // Load initial data
      await this.loadAllData();

      // Initialize charts
      this.initializeCharts();

      // Setup real-time updates
      this.setupRealTimeUpdates();

      // Setup event listeners
      this.setupEventListeners();

      // Start auto-refresh
      this.startAutoRefresh();

      console.log("✅ Dashboard initialized successfully");
      this.showToast("Dashboard loaded successfully", "success");
    } catch (error) {
      console.error("❌ Dashboard initialization failed:", error);
      this.showToast("Failed to initialize dashboard", "error");
    }
  }

  // Get API base URL based on environment
  getApiBase() {
    const hostname = window.location.hostname;

    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return "http://localhost:3001/api";
    } else if (hostname.includes("staging")) {
      return "https://api-staging.brainsait.com";
    } else {
      return "https://api.brainsait.com";
    }
  }

  // Authentication and Security
  async initializeAuth() {
    const token = localStorage.getItem("authToken");
    const refreshToken = localStorage.getItem("refreshToken");

    if (!token && !refreshToken) {
      // Redirect to login if no tokens
      this.redirectToLogin();
      return;
    }

    if (token && this.isTokenExpired(token)) {
      if (refreshToken) {
        try {
          await this.refreshAuthToken(refreshToken);
        } catch (error) {
          console.error("Token refresh failed:", error);
          this.redirectToLogin();
        }
      } else {
        this.redirectToLogin();
      }
    }
  }

  isTokenExpired(token) {
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      const currentTime = Date.now() / 1000;
      return payload.exp < currentTime;
    } catch (error) {
      return true;
    }
  }

  async refreshAuthToken(refreshToken) {
    const response = await this.apiCall("/auth/refresh", {
      method: "POST",
      body: JSON.stringify({ refreshToken }),
      headers: { "Content-Type": "application/json" },
    });

    if (response.success) {
      localStorage.setItem("authToken", response.data.accessToken);
      localStorage.setItem("refreshToken", response.data.refreshToken);
    } else {
      throw new Error("Token refresh failed");
    }
  }

  redirectToLogin() {
    const currentUrl = encodeURIComponent(window.location.href);
    window.location.href = `https://auth.brainsait.com/login?redirect=${currentUrl}`;
  }

  // API utilities with caching and retry logic
  async apiCall(endpoint, options = {}, useCache = true) {
    const cacheKey = `${endpoint}-${JSON.stringify(options)}`;

    // Check cache first
    if (useCache && this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.config.cacheTimeout) {
        return cached.data;
      }
    }

    const url = `${this.apiBase}${endpoint}`;
    const defaultOptions = {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        "Content-Type": "application/json",
        "X-Client-Version": "1.2.0",
        "X-Language": this.currentLanguage,
      },
      ...options,
    };

    let retries = 0;
    while (retries < this.config.maxRetries) {
      try {
        const response = await fetch(url, defaultOptions);

        if (response.status === 401) {
          await this.initializeAuth();
          throw new Error("Authentication required");
        }

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        // Cache successful responses
        if (useCache && data.success) {
          this.cache.set(cacheKey, {
            data,
            timestamp: Date.now(),
          });
        }

        return data;
      } catch (error) {
        retries++;
        if (retries >= this.config.maxRetries) {
          console.error(`API call failed after ${retries} retries:`, error);
          throw error;
        }

        // Exponential backoff
        await this.delay(this.config.retryDelay * Math.pow(2, retries - 1));
      }
    }
  }

  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Load all dashboard data
  async loadAllData() {
    const loadingPromises = [
      this.loadDashboard(),
      this.loadTenants(),
      this.loadClaims(),
      this.loadNPHIESStatus(),
    ];

    try {
      await Promise.allSettled(loadingPromises);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    }
  }

  // Load dashboard analytics
  async loadDashboard() {
    try {
      console.log("📊 Loading dashboard analytics...");

      const response = await this.apiCall("/analytics/dashboard");

      if (response.success) {
        const data = response.data;

        // Update statistics with animation
        this.updateStatWithAnimation("totalClaims", data.totalClaims);
        this.updateStatWithAnimation("activePatients", data.activePatients);
        this.updateStatWithAnimation("autoApproved", data.autoApproved);
        this.updateStatWithAnimation(
          "avgProcessingTime",
          data.avgProcessingTime
        );
        this.updateStatWithAnimation(
          "monthlyRevenue",
          this.formatCurrency(data.monthlyRevenue)
        );

        // Update charts
        this.updateChartsData(data);

        console.log("✅ Dashboard analytics loaded");
      } else {
        throw new Error(response.message || "Failed to load analytics");
      }
    } catch (error) {
      console.error("❌ Failed to load dashboard analytics:", error);
      this.showToast("Failed to load analytics data", "error");
    }
  }

  // Load tenants/providers
  async loadTenants() {
    try {
      console.log("🏥 Loading healthcare providers...");

      this.showElement("tenantsLoading");
      this.hideElement("tenantsError");
      this.hideElement("tenantsTableContainer");

      const response = await this.apiCall("/tenants");

      if (response.success) {
        this.populateTenantsTable(response.data);

        this.hideElement("tenantsLoading");
        this.showElement("tenantsTableContainer");

        console.log(`✅ Loaded ${response.data.length} healthcare providers`);
      } else {
        throw new Error(response.message || "Failed to load providers");
      }
    } catch (error) {
      console.error("❌ Failed to load healthcare providers:", error);

      this.hideElement("tenantsLoading");
      this.showElement("tenantsError");
      this.setText(
        "tenantsError",
        `Failed to load providers: ${error.message}`
      );
    }
  }

  // Load claims
  async loadClaims() {
    try {
      console.log("📋 Loading recent claims...");

      this.showElement("claimsLoading");
      this.hideElement("claimsError");
      this.hideElement("claimsTableContainer");

      const response = await this.apiCall("/claims?limit=50&sort=-submittedAt");

      if (response.success) {
        this.populateClaimsTable(response.data);

        this.hideElement("claimsLoading");
        this.showElement("claimsTableContainer");

        console.log(`✅ Loaded ${response.data.length} recent claims`);
      } else {
        throw new Error(response.message || "Failed to load claims");
      }
    } catch (error) {
      console.error("❌ Failed to load claims:", error);

      this.hideElement("claimsLoading");
      this.showElement("claimsError");
      this.setText("claimsError", `Failed to load claims: ${error.message}`);
    }
  }

  // Load NPHIES integration status
  async loadNPHIESStatus() {
    try {
      console.log("🔗 Loading NPHIES integration status...");

      const response = await this.apiCall("/nphies/status");

      if (response.success) {
        this.populateNPHIESStatus(response.data);
        console.log("✅ NPHIES status loaded");
      } else {
        throw new Error(response.message || "Failed to load NPHIES status");
      }
    } catch (error) {
      console.error("❌ Failed to load NPHIES status:", error);
    }
  }

  // Populate tenants table
  populateTenantsTable(tenants) {
    const tbody = document.getElementById("tenantsBody");
    if (!tbody) return;

    tbody.innerHTML = tenants
      .map(
        (tenant) => `
            <tr data-tenant-id="${tenant.id}">
                <td>
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <i class="fas fa-hospital" style="color: var(--primary-color);"></i>
                        <div>
                            <div style="font-weight: 600;">${this.escapeHtml(tenant.name)}</div>
                            <div style="font-size: 0.75rem; color: var(--text-secondary);">${this.escapeHtml(tenant.type || "Healthcare Provider")}</div>
                        </div>
                    </div>
                </td>
                <td><span class="status ${tenant.plan?.toLowerCase() || "basic"}">${this.escapeHtml(tenant.plan || "Basic")}</span></td>
                <td><span class="status ${tenant.status?.toLowerCase() || "unknown"}">${this.escapeHtml(tenant.status || "Unknown")}</span></td>
                <td>${(tenant.claimsProcessed || 0).toLocaleString()}</td>
                <td>${tenant.lastActivity ? new Date(tenant.lastActivity).toLocaleDateString(this.getLocale()) : "Never"}</td>
                <td>
                    <div style="display: flex; gap: 0.5rem;">
                        <button class="btn btn-sm" onclick="dashboard.viewTenant('${tenant.id}')" aria-label="View provider details">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-sm btn-secondary" onclick="dashboard.editTenant('${tenant.id}')" aria-label="Edit provider">
                            <i class="fas fa-edit"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `
      )
      .join("");

    // Setup search and filter
    this.setupTableSearch("providersSearch", "tenantsTable");
    this.setupTableFilter("providersFilter", "tenantsTable", "status");
  }

  // Populate claims table
  populateClaimsTable(claims) {
    const tbody = document.getElementById("claimsBody");
    if (!tbody) return;

    tbody.innerHTML = claims
      .map(
        (claim) => `
            <tr data-claim-id="${claim.id}">
                <td>
                    <div style="font-family: monospace; font-weight: 600;">${this.escapeHtml(claim.id)}</div>
                    <div style="font-size: 0.75rem; color: var(--text-secondary);">${claim.type || "Medical"}</div>
                </td>
                <td>
                    <div style="font-weight: 600;">${this.escapeHtml(claim.patientName)}</div>
                    <div style="font-size: 0.75rem; color: var(--text-secondary);">${this.escapeHtml(claim.patientId || "")}</div>
                </td>
                <td style="font-weight: 600; color: var(--primary-color);">${this.formatCurrency(claim.amount)}</td>
                <td><span class="status ${claim.status?.toLowerCase() || "unknown"}">${this.escapeHtml(claim.status || "Unknown")}</span></td>
                <td>${claim.submittedAt ? new Date(claim.submittedAt).toLocaleDateString(this.getLocale()) : "Unknown"}</td>
                <td>
                    <div style="display: flex; gap: 0.5rem;">
                        <button class="btn btn-sm" onclick="dashboard.viewClaim('${claim.id}')" aria-label="View claim details">
                            <i class="fas fa-eye"></i>
                        </button>
                        ${
                          claim.status === "pending"
                            ? `
                            <button class="btn btn-sm btn-success" onclick="dashboard.approveClaim('${claim.id}')" aria-label="Approve claim">
                                <i class="fas fa-check"></i>
                            </button>
                        `
                            : ""
                        }
                    </div>
                </td>
            </tr>
        `
      )
      .join("");

    // Setup search and filter
    this.setupTableSearch("claimsSearch", "claimsTable");
    this.setupTableFilter("claimsFilter", "claimsTable", "status");
  }

  // Populate NPHIES status
  populateNPHIESStatus(statusData) {
    const container = document.getElementById("nphiesStatusGrid");
    if (!container) return;

    const statusItems = [
      {
        title: "PKI Certificate",
        value: statusData.pkiStatus || "Valid",
        description: "Digital certificate status",
        icon: "fas fa-certificate",
        type: statusData.pkiStatus === "Valid" ? "success" : "error",
      },
      {
        title: "FHIR Compliance",
        value: statusData.fhirCompliance || "100%",
        description: "FHIR R4 specification compliance",
        icon: "fas fa-code",
        type: "success",
      },
      {
        title: "Eligibility Service",
        value: statusData.eligibilityStatus || "Active",
        description: "Real-time eligibility verification",
        icon: "fas fa-user-check",
        type: statusData.eligibilityStatus === "Active" ? "success" : "warning",
      },
      {
        title: "Claims Submission",
        value: statusData.claimsSubmissionStatus || "Operational",
        description: "Claims submission endpoint status",
        icon: "fas fa-paper-plane",
        type:
          statusData.claimsSubmissionStatus === "Operational"
            ? "success"
            : "error",
      },
    ];

    container.innerHTML = statusItems
      .map(
        (item) => `
            <div class="nphies-status-card">
                <div class="nphies-status-header">
                    <div class="nphies-status-icon ${item.type}">
                        <i class="${item.icon}"></i>
                    </div>
                    <div class="nphies-status-title">${item.title}</div>
                </div>
                <div class="nphies-status-value status ${item.type}">${item.value}</div>
                <div class="nphies-status-description">${item.description}</div>
            </div>
        `
      )
      .join("");
  }

  // Initialize charts
  initializeCharts() {
    this.initializeClaimsChart();
    this.initializeRevenueChart();
  }

  initializeClaimsChart() {
    const ctx = document.getElementById("claimsChart");
    if (!ctx) return;

    this.charts.claims = new Chart(ctx, {
      type: "line",
      data: {
        labels: [],
        datasets: [
          {
            label: "Claims Processed",
            data: [],
            borderColor: "#667eea",
            backgroundColor: "rgba(102, 126, 234, 0.1)",
            borderWidth: 2,
            fill: true,
            tension: 0.4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              color: "rgba(0,0,0,0.1)",
            },
          },
          x: {
            grid: {
              color: "rgba(0,0,0,0.1)",
            },
          },
        },
      },
    });
  }

  initializeRevenueChart() {
    const ctx = document.getElementById("revenueChart");
    if (!ctx) return;

    this.charts.revenue = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels: ["Starter Plan", "Professional Plan", "Enterprise Plan"],
        datasets: [
          {
            data: [30, 45, 25],
            backgroundColor: ["#667eea", "#764ba2", "#00a86b"],
            borderWidth: 0,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "bottom",
          },
        },
      },
    });
  }

  // Update charts with new data
  updateChartsData(data) {
    if (this.charts.claims && data.claimsData) {
      this.charts.claims.data.labels = data.claimsData.labels;
      this.charts.claims.data.datasets[0].data = data.claimsData.values;
      this.charts.claims.update();
    }

    if (this.charts.revenue && data.revenueData) {
      this.charts.revenue.data.datasets[0].data = data.revenueData.values;
      this.charts.revenue.update();
    }
  }

  // Utility functions
  updateStatWithAnimation(elementId, newValue) {
    const element = document.getElementById(elementId);
    if (!element) return;

    const currentValue = element.textContent;
    if (currentValue === "-" || currentValue !== newValue.toString()) {
      element.style.transform = "scale(1.1)";
      element.style.transition = "transform 0.3s ease";

      setTimeout(() => {
        element.textContent = newValue.toLocaleString
          ? newValue.toLocaleString()
          : newValue;
        element.style.transform = "scale(1)";
      }, 150);
    }
  }

  formatCurrency(amount, currency = "SAR") {
    return new Intl.NumberFormat(this.getLocale(), {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  }

  getLocale() {
    return this.currentLanguage === "ar" ? "ar-SA" : "en-US";
  }

  escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  showElement(id) {
    const element = document.getElementById(id);
    if (element) element.style.display = "";
  }

  hideElement(id) {
    const element = document.getElementById(id);
    if (element) element.style.display = "none";
  }

  setText(id, text) {
    const element = document.getElementById(id);
    if (element) element.textContent = text;
  }

  // Search and filter functionality
  setupTableSearch(searchInputId, tableId) {
    const searchInput = document.getElementById(searchInputId);
    const table = document.getElementById(tableId);

    if (!searchInput || !table) return;

    searchInput.addEventListener("input", (e) => {
      const searchTerm = e.target.value.toLowerCase();
      const rows = table.querySelectorAll("tbody tr");

      rows.forEach((row) => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm) ? "" : "none";
      });
    });
  }

  setupTableFilter(filterSelectId, tableId, filterColumn) {
    const filterSelect = document.getElementById(filterSelectId);
    const table = document.getElementById(tableId);

    if (!filterSelect || !table) return;

    filterSelect.addEventListener("change", (e) => {
      const filterValue = e.target.value.toLowerCase();
      const rows = table.querySelectorAll("tbody tr");

      rows.forEach((row) => {
        if (!filterValue) {
          row.style.display = "";
          return;
        }

        const statusCell = row.querySelector(".status");
        if (statusCell) {
          const statusText = statusCell.textContent.toLowerCase();
          row.style.display = statusText.includes(filterValue) ? "" : "none";
        }
      });
    });
  }

  // Action handlers
  async viewClaim(claimId) {
    try {
      console.log(`👁️ Viewing claim ${claimId}`);

      const response = await this.apiCall(`/claims/${claimId}`);

      if (response.success) {
        this.showClaimModal(response.data);
      } else {
        this.showToast("Failed to load claim details", "error");
      }
    } catch (error) {
      console.error("Failed to view claim:", error);
      this.showToast("Error loading claim details", "error");
    }
  }

  async viewTenant(tenantId) {
    try {
      console.log(`👁️ Viewing tenant ${tenantId}`);

      const response = await this.apiCall(`/tenants/${tenantId}`);

      if (response.success) {
        this.showTenantModal(response.data);
      } else {
        this.showToast("Failed to load provider details", "error");
      }
    } catch (error) {
      console.error("Failed to view tenant:", error);
      this.showToast("Error loading provider details", "error");
    }
  }

  // Modal handlers
  showClaimModal(claim) {
    const modal = this.createModal(
      "Claim Details",
      this.generateClaimModalContent(claim)
    );
    document.body.appendChild(modal);
    modal.classList.add("show");
  }

  generateClaimModalContent(claim) {
    return `
            <div class="claim-sections">
                <div class="claim-section">
                    <h3 class="claim-section-title">
                        <i class="fas fa-user"></i>
                        Patient Information
                    </h3>
                    <div class="info-grid">
                        <div class="info-item">
                            <div class="info-label">Name</div>
                            <div class="info-value">${this.escapeHtml(claim.patientName)}</div>
                        </div>
                        <div class="info-item">
                            <div class="info-label">Patient ID</div>
                            <div class="info-value">${this.escapeHtml(claim.patientId)}</div>
                        </div>
                        <div class="info-item">
                            <div class="info-label">National ID</div>
                            <div class="info-value">${this.escapeHtml(claim.nationalId || "N/A")}</div>
                        </div>
                        <div class="info-item">
                            <div class="info-label">Date of Birth</div>
                            <div class="info-value">${claim.dateOfBirth ? new Date(claim.dateOfBirth).toLocaleDateString(this.getLocale()) : "N/A"}</div>
                        </div>
                    </div>
                </div>

                <div class="claim-section">
                    <h3 class="claim-section-title">
                        <i class="fas fa-stethoscope"></i>
                        Medical Information
                    </h3>
                    <div class="info-grid">
                        <div class="info-item">
                            <div class="info-label">Diagnosis</div>
                            <div class="info-value">${this.escapeHtml(claim.diagnosis || "N/A")}</div>
                        </div>
                        <div class="info-item">
                            <div class="info-label">Provider</div>
                            <div class="info-value">${this.escapeHtml(claim.provider?.name || "N/A")}</div>
                        </div>
                    </div>
                </div>

                <div class="claim-section">
                    <h3 class="claim-section-title">
                        <i class="fas fa-shield-alt"></i>
                        Insurance Coverage
                    </h3>
                    <div class="info-grid">
                        <div class="info-item">
                            <div class="info-label">Policy Number</div>
                            <div class="info-value">${this.escapeHtml(claim.insurance?.policyNumber || "N/A")}</div>
                        </div>
                        <div class="info-item">
                            <div class="info-label">Insurance Company</div>
                            <div class="info-value">${this.escapeHtml(claim.insurance?.company || "N/A")}</div>
                        </div>
                    </div>
                </div>

                <div class="claim-section">
                    <h3 class="claim-section-title">
                        <i class="fas fa-chart-line"></i>
                        Claim Summary
                    </h3>
                    <div class="summary-grid">
                        <div class="summary-item">
                            <div class="summary-label">Total Amount</div>
                            <div class="summary-value">${this.formatCurrency(claim.amount)}</div>
                        </div>
                        <div class="summary-item">
                            <div class="summary-label">Status</div>
                            <div class="summary-value">
                                <span class="status ${claim.status?.toLowerCase()}">${this.escapeHtml(claim.status)}</span>
                            </div>
                        </div>
                        <div class="summary-item">
                            <div class="summary-label">Submitted</div>
                            <div class="summary-value">${claim.submittedAt ? new Date(claim.submittedAt).toLocaleDateString(this.getLocale()) : "Unknown"}</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
  }

  createModal(title, content) {
    const modal = document.createElement("div");
    modal.className = "modal-overlay";
    modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2 class="modal-title">${title}</h2>
                    <button class="modal-close" onclick="dashboard.closeModal(this)" aria-label="Close modal">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    ${content}
                </div>
            </div>
        `;

    // Close on overlay click
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        this.closeModal(modal.querySelector(".modal-close"));
      }
    });

    return modal;
  }

  closeModal(closeButton) {
    const modal = closeButton.closest(".modal-overlay");
    if (modal) {
      modal.remove();
    }
  }

  // Toast notifications
  showToast(message, type = "info", duration = null) {
    const container = document.getElementById("toastContainer");
    if (!container) return;

    const toast = document.createElement("div");
    toast.className = `toast ${type}`;

    const icons = {
      success: "fas fa-check-circle",
      error: "fas fa-exclamation-circle",
      warning: "fas fa-exclamation-triangle",
      info: "fas fa-info-circle",
    };

    toast.innerHTML = `
            <div class="toast-icon">
                <i class="${icons[type] || icons.info}"></i>
            </div>
            <div class="toast-content">
                <div class="toast-message">${this.escapeHtml(message)}</div>
            </div>
            <button class="toast-close" onclick="this.parentElement.remove()" aria-label="Close notification">
                <i class="fas fa-times"></i>
            </button>
        `;

    container.appendChild(toast);

    // Auto-remove after duration
    setTimeout(() => {
      if (toast.parentElement) {
        toast.remove();
      }
    }, duration || this.config.toastDuration);
  }

  // Real-time updates via WebSocket
  setupRealTimeUpdates() {
    try {
      const wsUrl = this.apiBase.replace("http", "ws") + "/ws";
      this.socket = new WebSocket(wsUrl);

      this.socket.onopen = () => {
        console.log("🔗 WebSocket connected");
        this.showToast("Real-time updates connected", "success");
      };

      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleRealTimeUpdate(data);
        } catch (error) {
          console.error("Invalid WebSocket message:", error);
        }
      };

      this.socket.onclose = () => {
        console.log("📴 WebSocket disconnected");
        // Attempt to reconnect after 5 seconds
        setTimeout(() => this.setupRealTimeUpdates(), 5000);
      };

      this.socket.onerror = (error) => {
        console.error("WebSocket error:", error);
      };
    } catch (error) {
      console.warn("WebSocket not available, falling back to polling");
    }
  }

  handleRealTimeUpdate(data) {
    switch (data.type) {
      case "claim_update":
        this.loadClaims();
        this.showToast(`Claim ${data.claimId} updated`, "info");
        break;
      case "tenant_update":
        this.loadTenants();
        break;
      case "analytics_update":
        this.loadDashboard();
        break;
      default:
        console.log("Unknown real-time update:", data);
    }
  }

  // Auto-refresh functionality
  startAutoRefresh() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }

    this.refreshInterval = setInterval(() => {
      console.log("🔄 Auto-refreshing dashboard data...");
      this.loadAllData();
    }, this.config.refreshInterval);
  }

  stopAutoRefresh() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
  }

  // Event listeners
  setupEventListeners() {
    // Page visibility API to pause/resume updates
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") {
        this.startAutoRefresh();
        this.loadAllData();
      } else {
        this.stopAutoRefresh();
      }
    });

    // Keyboard shortcuts
    document.addEventListener("keydown", (e) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case "r":
            e.preventDefault();
            this.loadAllData();
            this.showToast("Dashboard refreshed", "success");
            break;
        }
      }
    });
  }

  // Translations
  async loadTranslations(language) {
    try {
      const response = await fetch(`/translations/${language}.json`);
      if (response.ok) {
        this.translations = await response.json();
        this.applyTranslations();
      }
    } catch (error) {
      console.warn("Translations not available:", error);
    }
  }

  applyTranslations() {
    const elements = document.querySelectorAll("[data-translate]");
    elements.forEach((element) => {
      const key = element.getAttribute("data-translate");
      const translation = this.getTranslation(key);
      if (translation) {
        element.textContent = translation;
      }
    });
  }

  getTranslation(key) {
    const keys = key.split(".");
    let value = this.translations;

    for (const k of keys) {
      if (value && typeof value === "object") {
        value = value[k];
      } else {
        return null;
      }
    }

    return value;
  }

  // Export functions
  async exportAnalytics() {
    try {
      this.showToast("Preparing analytics export...", "info");

      const response = await this.apiCall("/analytics/export", {
        method: "POST",
        body: JSON.stringify({ format: "excel", dateRange: "30d" }),
      });

      if (response.success) {
        const link = document.createElement("a");
        link.href = response.data.downloadUrl;
        link.download = `analytics-${new Date().toISOString().split("T")[0]}.xlsx`;
        link.click();

        this.showToast("Analytics exported successfully", "success");
      }
    } catch (error) {
      this.showToast("Failed to export analytics", "error");
    }
  }

  async exportProviders() {
    try {
      this.showToast("Preparing providers export...", "info");

      const response = await this.apiCall("/tenants/export", {
        method: "POST",
        body: JSON.stringify({ format: "csv" }),
      });

      if (response.success) {
        const link = document.createElement("a");
        link.href = response.data.downloadUrl;
        link.download = `providers-${new Date().toISOString().split("T")[0]}.csv`;
        link.click();

        this.showToast("Providers exported successfully", "success");
      }
    } catch (error) {
      this.showToast("Failed to export providers", "error");
    }
  }

  async exportClaims() {
    try {
      this.showToast("Preparing claims export...", "info");

      const response = await this.apiCall("/claims/export", {
        method: "POST",
        body: JSON.stringify({ format: "excel" }),
      });

      if (response.success) {
        const link = document.createElement("a");
        link.href = response.data.downloadUrl;
        link.download = `claims-${new Date().toISOString().split("T")[0]}.xlsx`;
        link.click();

        this.showToast("Claims exported successfully", "success");
      }
    } catch (error) {
      this.showToast("Failed to export claims", "error");
    }
  }

  // Action functions (placeholders for now)
  addProvider() {
    this.showToast("Add provider functionality coming soon", "info");
  }

  newClaim() {
    this.showToast("New claim functionality coming soon", "info");
  }

  async checkNPHIESStatus() {
    this.showToast("Checking NPHIES status...", "info");
    await this.loadNPHIESStatus();
    this.showToast("NPHIES status updated", "success");
  }

  async approveClaim(claimId) {
    try {
      const response = await this.apiCall(`/claims/${claimId}/approve`, {
        method: "POST",
      });

      if (response.success) {
        this.showToast("Claim approved successfully", "success");
        this.loadClaims();
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      this.showToast("Failed to approve claim", "error");
    }
  }

  editTenant(tenantId) {
    this.showToast("Edit tenant functionality coming soon", "info");
  }
}

// Global functions for HTML onclick handlers
window.toggleTheme = function () {
  const html = document.documentElement;
  const currentTheme = html.getAttribute("data-theme");
  const newTheme = currentTheme === "dark" ? "light" : "dark";

  html.setAttribute("data-theme", newTheme);
  localStorage.setItem("theme", newTheme);

  // Update icon
  const icon = document.getElementById("themeIcon");
  if (icon) {
    icon.className = newTheme === "dark" ? "fas fa-sun" : "fas fa-moon";
  }

  if (window.dashboard) {
    window.dashboard.currentTheme = newTheme;
    window.dashboard.showToast(`Switched to ${newTheme} theme`, "success");
  }
};

window.setLanguage = function (lang) {
  const html = document.documentElement;
  html.setAttribute("lang", lang);
  html.setAttribute("dir", lang === "ar" ? "rtl" : "ltr");
  localStorage.setItem("language", lang);

  // Update active button
  document.querySelectorAll(".language-toggle button").forEach((btn) => {
    btn.classList.remove("active");
  });
  event.target.classList.add("active");

  if (window.dashboard) {
    window.dashboard.currentLanguage = lang;
    window.dashboard.loadTranslations(lang);
    window.dashboard.showToast(
      `Language changed to ${lang === "ar" ? "Arabic" : "English"}`,
      "success"
    );
  }
};

// Export functions for HTML onclick handlers
window.exportAnalytics = function () {
  if (window.dashboard) {
    window.dashboard.exportAnalytics();
  }
};

window.exportProviders = function () {
  if (window.dashboard) {
    window.dashboard.exportProviders();
  }
};

window.exportClaims = function () {
  if (window.dashboard) {
    window.dashboard.exportClaims();
  }
};

window.addProvider = function () {
  if (window.dashboard) {
    window.dashboard.addProvider();
  }
};

window.newClaim = function () {
  if (window.dashboard) {
    window.dashboard.newClaim();
  }
};

window.checkNPHIESStatus = function () {
  if (window.dashboard) {
    window.dashboard.checkNPHIESStatus();
  }
};

// Initialize dashboard when DOM is ready
window.initializeDashboard = function () {
  window.dashboard = new BrainSAITDashboard();
  window.dashboard.initializeDashboard();
};

// Load saved preferences
(function () {
  const savedTheme = localStorage.getItem("theme") || "light";
  const savedLang = localStorage.getItem("language") || "en";

  document.documentElement.setAttribute("data-theme", savedTheme);
  document.documentElement.setAttribute("lang", savedLang);
  document.documentElement.setAttribute(
    "dir",
    savedLang === "ar" ? "rtl" : "ltr"
  );
})();

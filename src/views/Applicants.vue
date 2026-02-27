<template>
  <div class="container mt-5">
    <h2 class="mb-4 text-center">User Management</h2>

    <!-- Tabs -->
    <ul class="nav nav-tabs mb-4">
      <li class="nav-item">
        <button class="nav-link" :class="{ active: activeTab === 'participant' }" @click="activeTab = 'participant'">
          Participant Users
        </button>
      </li>
      <!-- Only Oscar should have access to Staff -->
      <li class="nav-item" v-if="isOscar">
        <button class="nav-link" :class="{ active: activeTab === 'staff' }" @click="activeTab = 'staff'">
          Staff Users
        </button>
      </li>
      <li class="nav-item" v-if="isOscar">
        <button class="nav-link" :class="{ active: activeTab === 'all' }" @click="activeTab = 'all'">
          All Users
        </button>
      </li>
    </ul>

    <!-- Add Total Users -->
    <div class="tshirt-compact-row items-center">
    
      <h5 class="me-4 text-nowrap mb-0 lh-1">
        👕 T-Shirt Sizes ({{ activeTab.toUpperCase() }}):
      </h5>
      
      <div 
        v-for="(count, size) in tshirtSizeTally.tally" 
        :key="size" 
        class="me-3 text-nowrap lh-1"
        :class="{'text-danger fw-bold': size === 'N/A'}"
      >
        <span class="fw-bold">{{ size }}:</span> {{ count }}
      </div>

      <span class="badge bg-primary fs-6 text-nowrap me-3 ms-auto mb-0">
        Total Order: {{ tshirtSizeTally.totalShirts }}
      </span>

      <!-- Qr Code Scanner -->
      <button @click=openScanner class="btn btn-success mb-0 fw-bold me-3">
        Scan User QR Code
      </button>

      <div v-if="showScanner" class="modal-overlay-scanner">
        <div class="modal-content-scanner">
        <h3>Scan QR code</h3>

        <qrcode-stream
            :paused="paused"
            @init="onInit"
            @detect="QRDetect"
            class="scanner-camera"
        />

        <button @click="closeScanner" class="btn btn-success mb-0 fw-bold">
          Close
        </button>

        </div>
      </div>


      <button class="btn btn-success mb-0 fw-bold" @click="openExportModal" v-if="isOscar">
        Export Users
      </button>
      
    </div>

    <!-- Search Input -->
    <div class="mb-4">
      <input type="text" v-model="searchQuery" class="form-control" placeholder="Search by name" />
    </div>

    <!-- Add Oscar functionality for changing User info -->
    <!-- - Also for changing user's role -->
    <!-- Add Download User emails button-->
    <!-- Add Export All Users button -->

    <!-- EXPORT USERS MODAL -->
    <div v-if="showExportModal" class="modal d-block" tabindex="-1" role="dialog" style="background-color: rgba(0,0,0,0.5);">
      <div class="modal-dialog modal-lg" role="document">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Export User Fields</h5>
            <button type="button" class="btn-close" @click="closeExportModal"></button>
          </div>
          <div class="modal-body">
            
            <!-- ROLE FILTER -->
            <div class="mb-4">
              <p class="fw-bold">Role Filter:</p>
              <div class="form-check form-check-inline">
                <input class="form-check-input" type="radio" id="roleParticipant" value="PARTICIPANT" v-model="exportRoleFilter">
                <label class="form-check-label" for="roleParticipant">Participant</label>
              </div>
              <div class="form-check form-check-inline">
                <input class="form-check-input" type="radio" id="roleStaff" value="STAFF" v-model="exportRoleFilter">
                <label class="form-check-label" for="roleStaff">Staff</label>
              </div>
              <div class="form-check form-check-inline">
                <input class="form-check-input" type="radio" id="roleAll" value="ALL" v-model="exportRoleFilter">
                <label class="form-check-label" for="roleAll">All</label>
              </div>
            </div>

            <hr>

            <!-- FIELD SELECTION -->
            <p class="fw-bold">Select the data fields (columns) you want to appear in the CSV file:</p>
            
            <div class="d-flex mb-3">
              <button class="btn btn-sm btn-outline-secondary me-2" @click="toggleAllExportFields(true)">Select All Fields</button>
              <button class="btn btn-sm btn-outline-secondary" @click="toggleAllExportFields(false)">Deselect All Fields</button>
            </div>

            <div class="row">
              <div class="col-md-4" v-for="field in exportFields" :key="field.key">
                <div class="form-check">
                  <!-- The v-model ensures the checkbox state is tied to the field.checked property -->
                  <input class="form-check-input" type="checkbox" :id="'field-' + field.key" v-model="field.checked">
                  <label class="form-check-label" :for="'field-' + field.key">
                    {{ field.label }}
                  </label>
                </div>
              </div>
            </div>

          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="closeExportModal">Cancel</button>
            <button type="button" class="btn btn-success" @click="handleExportSubmit">Export</button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showEditUserForm && isOscar" class="modal fade show d-block" tabindex="-1" role="dialog">
      <div class="modal-dialog modal-lg" role="document">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Edit User: {{ editUserData.firstName }} {{ editUserData.lastName }}</h5>
            <button type="button" class="btn-close" @click="cancelEditUser"></button>
          </div>
          
          <div class="modal-body">
            <div v-if="editUserError" class="alert alert-danger">{{ editUserError }}</div>
            
            <form @submit.prevent="handleUpdateUser">
              <div class="mb-3">
                <label for="editFirstName" class="form-label">First Name</label>
                <input type="text" class="form-control" id="editFirstName" v-model="editUserData.firstName" required>
              </div>

              <div class="mb-3">
                <label for="editLastName" class="form-label">Last Name</label>
                <input type="text" class="form-control" id="editLastName" v-model="editUserData.lastName" required>
              </div>

              <div class="mb-3">
                <label for="editEmail" class="form-label">Email</label>
                <input type="email" class="form-control" id="editEmail" v-model="editUserData.email" required>
              </div>
              
              <div class="mb-3" v-if="isOscar">
                <label for="editRole" class="form-label">Role</label>
                
                <select 
                  class="form-select" 
                  id="editRole" 
                  v-model="editUserData.role"
                >
                  <option 
                      v-for="role in userRoles" 
                      :key="role.value" 
                      :value="role.value"
                  >
                      {{ role.text }}
                  </option>
                </select>
                <div v-if="revertMessage" class="alert alert-danger mt-2" role="alert">
                  {{ revertMessage }}
                </div>
                <div v-else-if="isPrivilegedRole(editUserData.role) && isYorkCollegeUser" class="alert alert-warning mt-2" role="alert">
                  Role change to '{{ editUserData.role }}' is permitted for York College users.
                </div>
              </div>

              <div class="mb-3" v-if="isOscar">
                <hr>
                <div class="form-check form-switch">
                  <input 
                    class="form-check-input" 
                    type="checkbox" 
                    id="editIsBanned"
                    v-model="editUserData.isBanned"
                  >
                  <label class="form-check-label text-danger fw-bold" for="editIsBanned">
                    ⚠️ BANNED from Hackathon
                  </label>
                  <div v-if="editUserData.isBanned" class="alert alert-danger mt-2">
                    **ACTION:** Banning this user prevents them from registering for a team or participating.
                  </div>
                </div>
                <hr>
              </div>
              
              <div class="row">
                <div class="col-md-4 mb-3">
                  <label for="editAge" class="form-label">Age</label>
                  <input type="number" class="form-control" id="editAge" v-model="editUserData.age">
                </div>
                <div class="col-md-4 mb-3">
                  <label for="editPhone" class="form-label">Phone Number</label>
                  <input type="text" class="form-control" id="editPhone" v-model="editUserData.phoneNumber">
                </div>
                <div class="col-md-4 mb-3">
                  <label for="editSchool" class="form-label">School</label>
                  <input type="text" class="form-control" id="editSchool" v-model="editUserData.school">
                </div>
              </div>

              <div class="row">
                <div class="col-md-6 mb-3">
                  <label for="editTShirtSize" class="form-label">T-Shirt Size</label>
                  <select 
                      class="form-select" 
                      id="editTShirtSize" 
                      v-model="editUserData.tShirtSize"
                  >
                      <option 
                          v-for="size in tShirtSizes" 
                          :key="size.value" 
                          :value="size.value"
                      >
                          {{ size.text }}
                      </option>
                  </select>
                </div>
                <div class="col-md-6 mb-3">
                  <label for="editDietary" class="form-label">Dietary Restrictions</label>
                  <input type="text" class="form-control" id="editDietary" v-model="editUserData.dietaryRestrictions">
                </div>
              </div>
              
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" @click="cancelEditUser">Cancel</button>
                <button type="submit" class="btn btn-primary">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showEditUserForm && isOscar" class="modal-backdrop fade show"></div>

    <!-- Table Section -->
    <div class="table-container shadow-lg rounded overflow-hidden">
      <div class="table-responsive">
        <table class="table table-striped table-hover">
          <thead class="thead-light">
            <tr>
              <th class="text-center" style="width: 1px;">🚨</th>
              <th class="text-left role-column-header" v-if="activeTab === 'all'">Role</th>
              <th class="text-left" v-if="activeTab === 'participant'">Checked In?</th>
              <th class="text-left">First Name</th>
              <th class="text-left">Last Name</th>
              <th class="text-left">Age</th>
              <th class="text-left">Email</th>
              <th class="text-left">Phone Number</th>
              <th class="text-left">School</th>
              <th class="text-left">T-Shirt Size</th>
              <th class="text-left">Dietary Restrictions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="filteredUsers.length === 0">
              <td colspan="5" class="text-center py-4 text-muted">
                No users found
              </td>
            </tr>
            <tr v-for="(user, index) in filteredUsers" :key="user.id"
              @click="openEditUserForm(index)" style="cursor: pointer;">

              <td class="text-center align-middle" style="width: 1px">
                <span v-if="user.isBanned" class="text-danger fs-4" title="BANNED USER">
                  ⚠️
                </span>
                <span v-else class="text-muted">-</span>
              </td>
              <!-- Add Check Boxes for Check in -->
              <td v-if="activeTab === 'all'" class="role-column">
                <div class="role-badge-wrapper">
                  <span 
                    class="badge role-badge text-center" 
                    :class="getRoleBadgeClass(user.role)"
                  >
                    {{ user.role.toUpperCase() }}
                  </span>
                </div>
              </td>
              <td class="text-center align-middle table-checkbox-center" v-if="activeTab === 'participant'">
                <input 
                  type="checkbox" 
                  :checked="user.checkIn" 
                  @change="toggleCheckIn(user.id)" 
                  @click.stop
                  class="form-check-input"
                >
              </td>
              <td>{{ user.firstName }}</td>
              <td>{{ user.lastName }}</td>
              <td>{{ user.age }}</td>
              <td>{{ user.email }}</td>
              <td>{{ user.phoneNumber }}</td>
              <td>{{ user.school }}</td>
              <td>{{ user.tShirtSize }}</td>
              <!-- Add in dietary highlights -->
              <td class="text-center">
                <span 
                  v-if="user.dietaryRestrictions && user.dietaryRestrictions.toLowerCase() !== 'none' && user.dietaryRestrictions.toLowerCase() !== 'null'"
                  :class="getDietaryRestriction(user.dietaryRestrictions)"
                >
                  {{ user.dietaryRestrictions }}
                </span>
                <span v-else class="text-muted">–</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script>
import axios from "axios";
import store from "../store/store.js";
import { QrcodeStream } from 'vue-qrcode-reader'


const DIET_RESTRICTIONS = [
  'vegan',
  'veggie',
  'vegetarian',
  'pescatarian',
  'gluten',
  'dairy',
  'lactose',
  'keto',
  'paleo',
  'low-carb',
  'sugar-free',
];

const RELIGIOUS_RESTRICTIONS = [
  'kosher',
  'halal',
  'jain',
  'buddhist',
];

const ALLERGY_KEYWORDS = [
  'allergy',
  'allergic',
  'nut',
  'shellfish',
  'peanut',
  'tree nut',
  'soy',
  'wheat',
  'egg',
];

const ALL_EXPORT_FIELDS = [
  { key: 'firstName', label: 'First Name', default: true },
  { key: 'lastName', label: 'Last Name', default: true },
  { key: 'email', label: 'Email', default: true },
  { key: 'phoneNumber', label: 'Phone Number', default: true },
  { key: 'gender', label: 'Gender', default: true },
  { key: 'linkedInUrl', label: 'LinkedIn URL', default: false },
  
  { key: 'country', label: 'Country', default: true },
  { key: 'tShirtSize', label: 'T-Shirt Size', default: true },
  { key: 'dietaryRestrictions', label: 'Dietary Restrictions', default: true },
  { key: 'school', label: 'School', default: true },
  { key: 'hackathonsAttended', label: 'Hackathons Attended', default: true },
  
  { key: 'pronouns', label: 'Pronouns', default: true },
  { key: 'age', label: 'Age', default: true },
  { key: 'major', label: 'Major', default: true },
  { key: 'graduationYear', label: 'Graduation Year', default: true },
  { key: 'levelOfStudy', label: 'Level of Study', default: true },

  { key: 'checkIn', label: 'Checked In', default: false },
  { key: 'role', label: 'Internal Role', default: false },
];

export default {
  name: "UserManagement",

  components:{
    QrcodeStream
  },

  watch: {
    'editUserData.role'(newRole, oldRole) {
      if(this.showEditUserForm && newRole !== oldRole) {
        this.checkRoleChangeEligibility(newRole, oldRole);
      }
    },
    'editUserData.school'(newRole, oldRole) {
      if(this.showEditUserForm && this.isPrivilegedRole(this.editUserData.role)){
        this.checkSchoolChangeClearsError();
      }
    }
  },
  // created() {
  //   this.fetchUsers();
  // },
  data() {
    return {
      showScanner: false, // These are for the QR scanner
      paused: false,

      users: [],
      searchQuery: "",
      activeTab: "participant", // 'all' or 'staff'

      showEditUserForm: false,
      editUserIndex: null,
      editUserData: {},
      editUserOriginalData: {},
      editUserError: null,

      revertMessage: null,

      tShirtSizes: [
        { value: null, text: '-Select One-' },
        { value: "XS", text: 'XS' },
        { value: "S", text: 'S' },
        { value: "M", text: 'M' },
        { value: "L", text: 'L' },
        { value: "XL", text: 'XL' },
        { value: "2XL", text: '2XL' },
        { value: "3XL", text: '3XL' }
      ],
      userRoles: [
        { value: 'PARTICIPANT', text: 'Participant' },
        { value: 'STAFF', text: 'Staff' },
        { value: 'OSCAR', text: 'Oscar' }
      ],

      privilegedRoles: ['OSCAR', 'STAFF'],

      showExportModal: false,
      exportRoleFilter: 'PARTICIPANT',
      exportFields: []
    };
  },
  async mounted() {
    await this.$store.dispatch('getActiveEvent'); 
    this.fetchUsers();
  },
  computed: {
    activeEventId(){
      return this.$store.state.activeEvent;
    },
    isOscar(){
      return this.$store.getters.UserRole === 'oscar';
    },
    filteredUsers() {
      const query = this.searchQuery.toLowerCase();
      let list = this.users;

      if(this.activeTab === "staff"){
        list = this.users.filter(user => user.role.toLowerCase() === "staff" || user.role.toLowerCase() === "oscar");
      }else if(this.activeTab === "participant"){
        list = this.users.filter(user => user.role.toLowerCase() === "participant");
      }

      let filteredList = list.filter(
        user=>
          user.firstName.toLowerCase().includes(query) ||
          user.lastName.toLowerCase().includes(query) ||
          user.email.toLowerCase().includes(query) ||
          (user.tShirtSize && user.tShirtSize.toLowerCase().includes(query)) ||
          (user.dietaryRestrictions && user.dietaryRestrictions.toLowerCase().includes(query)) ||
          (user.school && user.school.toLowerCase().includes(query))
      );

      filteredList.sort((a, b) => {
        // Sort by last name
        if (a.lastName < b.lastName) return -1;
        if (a.lastName > b.lastName) return 1;

        // If last names are equal, sort by first name
        if (a.firstName < b.firstName) return -1;
        if (a.firstName > b.firstName) return 1;
        return 0;
      });
      
      return filteredList;
    },
    tshirtSizeTally() {
      const tally = this.filteredUsers.reduce((acc, user) => {
        const size = user.tShirtSize ? user.tShirtSize.toUpperCase().trim() : 'N/A';
      
        if (size){
          acc[size] = (acc[size] || 0) + 1;
        }
        return acc;
      }, {});

      const order = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', 'N/A'];
      const orderedTally = {};
      let totalShirts = 0;

      order.forEach(key => {
        if (tally[key]) {
          orderedTally[key] = tally[key];
          // Only count actual sizes towards the order total
          if (key !== 'N/A') { 
            totalShirts += tally[key];
          }
        }
      });

      return {
        tally: orderedTally,
        totalShirts: totalShirts
      };
    },
    isYorkCollegeUser() {
      if (!this.editUserData.school) return false;
      const schoolInput = this.editUserData.school.toUpperCase();
      return schoolInput.includes('YORK COLLEGE');
    }
  },
  methods: {
    /*Initialize QR code scanner */
    async onInit(promise){
      try{
        await promise
        console.log("camera ready")
      } catch (err){
        console.error(err)
      }
    },

    /* Actions that will be preformed if a QR code is detected */
    async QRDetect(codes){
      // Pause the scanner to process the QR code
      this.paused = true
      try{
        const rawData = codes[0].rawValue;
        const cleanUserId = rawData.replace(/['"]+/g, '').trim();

        console.log("Detected:",codes)
        await this.validateQR(cleanUserId);
      } catch (err){
        console.error("QR parse error:", err);
        alert("Invalid QR Code");
      } finally {
        // Resume scanning
          this.paused = false;
      }
    },

    /* validate QR code data */
    async validateQR(userId){
      try{
        const response = await axios.post(
            `${store.state.apiBaseUrl}/user/validate-qr`,
            {userId}
        );

        if(response.data.valid){
          console.log("User validated", response.data.user);
          const updatedUser = response.data.user;
          const index = this.users.findIndex(u => u.id === updatedUser.id);

          if (index !== -1 && this.users[index].checkIn === true) {
            alert("User is already checked in!");
            return;
          }

          alert("Check-in successful!");

          // Update only the checkIn property
          await this.toggleCheckIn(updatedUser);
          this.users[index].checkIn = updatedUser.checkIn;

        } else {
          alert("Invalid QR Code");
        }

      } catch (err) {
        console.error("Validation failed:", err);
        alert("Server error validating QR");
      }
    },

    /* Open the Scanner modal window */
    openScanner(){
      this.showScanner = true;
      this.paused = false;
    },

    /* Closes the Scanner */
    closeScanner(){
      this.showScanner = false;
      this.paused = true;
    },
    /**
     * Initializes the exportFields array based on the ALL_EXPORT_FIELDS constant.
     */
    initializeExportFields() {
      this.exportFields = ALL_EXPORT_FIELDS.map(f => ({
        key: f.key,
        label: f.label,
        checked: f.default,
      }));
    },
    
    /**
     * Toggles the checked status of all export fields.
     */
    toggleAllExportFields(checked) {
      this.exportFields.forEach(field => {
        field.checked = checked;
      });
    },

    /**
     * Handles the full export process based on modal selections.
     */
    handleExportSubmit() {
      // 1. Determine users to export based on Role Filter
      const role = this.exportRoleFilter;
      let usersToExport = [];

      if (role === 'ALL') {
        usersToExport = this.users;
      } else if (role === 'PARTICIPANT') {
        usersToExport = this.users.filter(user => user.role.toUpperCase() === 'PARTICIPANT');
      } else if (role === 'STAFF') {
        // Note: This includes 'OSCAR' as staff since privileged roles were defined as staff.
        usersToExport = this.users.filter(user => this.isPrivilegedRole(user.role));
      }

      if (usersToExport.length === 0) {
        console.warn(`No users found for the selected role: ${role}.`);
        // Show a simple error message to the user instead of just console.warn
        // In a real app, you would use a notification system here.
        alert(`Cannot export: No users found for the selected role filter (${role}).`);
        return;
      }

      // 2. Determine fields to export
      const selectedFields = this.exportFields.filter(f => f.checked);

      if (selectedFields.length === 0) {
        console.warn("Please select at least one data field (column) to export.");
        alert("Please select at least one data field (column) to export.");
        return;
      }

      // 3. Initiate CSV export with filtered data and selected columns
      this.exportToCSV(usersToExport, selectedFields);
      this.closeExportModal();
    },

    openExportModal() {
      this.exportFields = ALL_EXPORT_FIELDS.map(f => ({
        key: f.key,
        label: f.label,
        checked: f.default,
      }));
      
      this.showExportModal = true;
      // Optionally reset to default filter/fields every time it opens
      this.exportRoleFilter = 'PARTICIPANT';
    },

    closeExportModal() {
        this.showExportModal = false;
    },
    isPrivilegedRole(role){
      if (!role) return false;
      return this.privilegedRoles.includes(role.toUpperCase());
    },
    checkRoleChangeEligibility(newRole, oldRole){
      this.revertMessage = null;

      if(this.isPrivilegedRole(newRole)){
        if(!this.isYorkCollegeUser){
          this.$nextTick(() => {
            this.editUserData.role = oldRole;
          });

          this.revertMessage = `Access Denied: Only users from a 'York College' institution can be assigned the ${newRole} role. Role reverted to ${oldRole}.`;
        }else{
          this.revertMessage = null;
        }
      }
    },
    checkSchoolChangeClearsError() {
      if(this.revertMessage && this.isPrivilegedRole(this.editUserData.role)){
        if(this.isYorkCollegeUser){
          this.revertMessage = null;
        }
      }
    },
    async fetchUsers() {
      const eventId = this.activeEventId;

      try {
        const response = await axios.get(`${store.state.apiBaseUrl}/user/all?eventId=${eventId}`);
        this.users = response.data.data;
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    },
    async toggleCheckIn(userId){
      // console.log('Attempting to toggle check-in for ID:', userId);
      const userIdNumber = Number(userId);
      const user = this.users.find(u => u.id === userIdNumber);
      if(!user) return;

      const newCheckInStatus = !user.checkIn;

      try{
        await axios.put(`${store.state.apiBaseUrl}/user/${userId}/checkin`, {
          checkIn: newCheckInStatus
        });

        // Set the new check in status
       user.checkIn = newCheckInStatus;
      }catch (err){
        console.error(`Error toggling check-in for user ${userId}:`, err);
      }
    },
    exportToCSV(usersToExport, selectedFields){
      if (usersToExport.length === 0){
        console.warn("No users to export.");
        return;
      }

      // Helper function to safely enclose data in quotes and escape internal quotes
      const sanitizeValue = (value) => {
        if (value === null || value === undefined) return '""';
        
        // Convert to string and handle boolean/numeric values
        let stringValue = String(value);

        // Improved handling for boolean values in CSV export
        if (typeof value === 'boolean' || (typeof value === 'number' && (value === 0 || value === 1))) {
          stringValue = value ? 'Yes' : 'No';
        }

        // Escape double quotes by doubling them up
        stringValue = stringValue.replace(/"/g, '""');

        // Enclose the entire value in double quotes
        return `"${stringValue}"`;
      };

      // 1. Generate the Header Row (using labels from selectedFields)
      const headerRow = selectedFields.map(field => sanitizeValue(field.label)).join(',');

      // 2. Generate the Data Rows
      const dataRows = usersToExport.map(user => {
        // Map each field key to the corresponding value from the user object
        const row = selectedFields.map(field => {
          const value = user[field.key];
          return sanitizeValue(value);
        }).join(',');
        return row;
      });

      // 3. Combine Header and Data Rows
      const csvContent = [headerRow, ...dataRows].join('\n');

      // 4. Create a Blob and Download Link
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'user_export.csv');
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
      
      console.log("CSV export initiated.");
    },
    getDietaryRestriction(restriction){
      if(!restriction || restriction.toLowerCase() === 'none' || restriction.toLowerCase() === 'null'){
        return '';
      }

      const normalizedRestriction = restriction.toLowerCase();
      
      for (const term of ALLERGY_KEYWORDS) {
        if (normalizedRestriction.includes(term)) {
              return 'badge bg-danger text-white'; // Red
        }
      }

      for (const term of DIET_RESTRICTIONS){
        if(normalizedRestriction.includes(term)){
          return 'badge bg-warning text-dark';
        }
      }

      for (const term of RELIGIOUS_RESTRICTIONS) {
        if (normalizedRestriction.includes(term)) {
          return 'badge bg-info text-dark';
        }
      }

      return 'badge bg-danger text-white';
    },
    getRoleBadgeClass(role) {
      if (!role) return 'bg-secondary';
      
      const normalizedRole = role.toLowerCase().trim();
      
      switch (normalizedRole) {
        case 'oscar':
          // Highest authority, stands out immediately
          return 'bg-danger text-white'; 
        case 'staff':
          // Important, but secondary to Oscar
          return 'bg-primary text-white';
        case 'participant':
          return 'bg-success text-white'; 
        default:
          // Fallback for unexpected roles
          return 'bg-secondary text-white';
      }
    },
    openEditUserForm(index){
      const user = this.filteredUsers[index];

      const originalIndex = this.users.findIndex(u => u.id === user.id);

      if(originalIndex === -1){
        console.error("Could not find user in original array.")
        return;
      }

      this.editUserIndex = originalIndex;
      this.showEditUserForm = true;
      this.editUserError = null;

      const {password, mlhCodeOfConduct, mlhPrivaryPolicy, mlhEmails, ...editableData } = user
      this.editUserData = {...editableData};
      this.editUserOriginalData = { ... editableData };

      if (this.editUserData.role) {
        this.editUserData.role = this.editUserData.role.toUpperCase();
      }
    },
    async handleUpdateUser(){
      this.editUserError = null;

      const userId = this.editUserData.id;

      const originalIsBanned = this.editUserOriginalData.isBanned;
      const newIsBanned = this.editUserData.isBanned;

      try{
        const payload ={
          firstName: this.editUserData.firstName,
          lastName: this.editUserData.lastName,
          age: this.editUserData.age,
          email: this.editUserData.email,
          phoneNumber: this.editUserData.phoneNumber,
          school: this.editUserData.school,
          tShirtSize: this.editUserData.tShirtSize,
          dietaryRestrictions: this.editUserData.dietaryRestrictions,
          role: this.editUserData.role,
          isBanned: this.editUserData.isBanned
        };

        await axios.put(`${store.state.apiBaseUrl}/user/${userId}`, payload);

        if (originalIsBanned && !newIsBanned) {
          console.log(`Ban lifted for user ${userId}. Unassigning from team...`);
          await this.unassignParticipant(userId);
        }

        const userToUpdate = this.users[this.editUserIndex];
        if(userToUpdate){
          Object.assign(userToUpdate, this.editUserData);
        }
        
        await this.fetchUsers()

        this.showEditUserForm = false;
        this.editUserIndex = null;
      } catch (err) {
        console.error("Error updating user:", err);
        const errorMessage = err.response?.data?.message || err.response?.data?.error || "An unknown error occurred during user update.";
        this.editUserError = errorMessage;
      }
    },
    cancelEditUser() {
      this.showEditUserForm = false;
      this.editUserIndex = null;
      this.editUserError = null;
      this.editUserData = {};
    },
    async unassignParticipant(userId, eventId=1){
      try{
        await axios.put(`${store.state.apiBaseUrl}/event-participant/unassign`, {
          userId: userId,
          eventId: eventId
        });
        console.log(`User ${userId} successfully unassigned from team.`);
      } catch (error) {
        console.error(`Error unassigning user ${userId} from team:`, error.response?.data?.message || error.message);
      }
    }
  },
};
</script>

<style scoped>
.container {
  max-width: 100%;
}

.nav-tabs {
  border-bottom: 1px solid #dee2e6;
}

.nav-link {
  color: #495057;
  padding: 0.75rem 1rem;
  cursor: pointer;
}

.nav-link.active {
  background-color: #f8f9fa;
  border-color: #dee2e6 #dee2e6 #fff;
  font-weight: bold;
}

.table-container {
  border-radius: 0.75rem;
}

.table-responsive {
  overflow-x: auto;
}

.table {
  margin: 0;
  font-size: 0.875rem;
  table-layout: auto;
}

.table thead th.role-column-header{
  /* Apply shrink-wrap to header */
  width: 130px;
  white-space: nowrap;
  text-align: center;
  max-width: 130px;
}

.table tbody tr td.role-column {
  width: 130px;
  max-width: 130px;
  padding: 0.3rem 2px;
  white-space: nowrap;
  overflow: hidden;
  
  vertical-align: middle;
  text-align: center;
}

.table tbody tr td:last-child{
  width: 1px;
  white-space: nowrap;
  padding-left: 0.5rem;
  padding-right: 0.5rem;
}

.role-badge-wrapper {
  width: 130px;
  max-width: 130px;
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
}

.badge.role-badge{
  /* padding: 0.1rem 2px !important; */
  padding-top: 5px !important;
  padding-bottom: 5px !important;
  padding-left: 0.5rem !important;
  padding-right: 0.5rem !important;
  font-size: 0.8em !important;
  display: block;
  white-space: nowrap !important;
  line-height: 1 !important;
  font-weight: 700 !important;
  margin: 0;
  text-align: center;
}

.table tbody tr td .badge{
  font-weight: normal;
}

.table td:nth-child(5){
  max-width: 150px;
  word-break: break-all;
  white-space: normal !important;
}

.thead-light th {
  background-color: #f8f9fa;
  color: #495057;
  font-weight: 600;
  vertical-align: middle;
  text-align: center;
  white-space: normal;
}

table tbody tr td.table-checkbox-center .form-check-input{
  margin-left: auto !important;
  margin-right: auto !important;
  display: block !important;
  float: none !important;
}

.table td{
  text-align: center;
  vertical-align: middle;
}

.table-striped tbody tr:nth-of-type(odd) {
  background-color: #f2f2f2;
}

.table-hover tbody tr:hover {
  background-color: #e9ecef;
}

.shadow-lg {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.form-control {
  border-radius: 0.5rem;
}

.tshirt-compact-row {
  background-color: #f8f9fa; /* Light background for visibility */
  border: 1px solid #dee2e6;
  padding: 8px 5px; /* Smaller padding */
  border-radius: 0.5rem;
  font-size: 0.9rem; /* Slightly smaller font */
  display: flex; /* Ensures flexible alignment */
  flex-wrap: nowrap; /* CRITICAL: Prevents wrapping to multiple lines */
  overflow-x: auto; /* Allows scrolling if the list gets too long */
  align-items: center !important;
}

.tshirt-compact-row h5 {
    font-size: 1.1rem; /* Adjust heading size */
    margin-top: 0 !important;
    margin-bottom: 0 !important;
    padding-top: 0 !important;
    padding-bottom: 0 !important;
    font-weight: 700;
    line-height: 1.6 !important;
}

/* Ensure the search bar is still positioned correctly below */
.mb-4 {
  margin-bottom: 1.5rem !important;
}

.revert-messgae{
  margin: 1rem 0;
  padding: 0.75rem 1rem;
  border: 1px solid #dc3545;
  border-left: 5px solid #dc3545;
  border-radius: 0.25rem;

  background-color: #f8d7da;
  color: #721c24;
  font-size: 0.9rem;
  font-weight: 500;
}

/* Add this new CSS block to manually fix the vertical alignment of buttons/badges */
.tshirt-compact-row .badge, 
.tshirt-compact-row .btn {
  padding-top: 4px !important;
  padding-bottom: 4px !important;
  /* Moves the badge and button DOWN by 1 pixel */
  transform: none !important; 
  margin-bottom: 0 !important;
  flex-shrink: 0;
}

/* These are for the QR scanner */
.modal-overlay-scanner {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0,0,0,0.6);

  display: flex;
  justify-content: center;
  align-items: center;

  z-index: 9999;
}

.modal-content-scanner {
  background: white;
  padding: 20px;
  border-radius: 10px;
  width: 400px;
  text-align: center;
}

.scanner-camera {
  width: 100%;
  height: 300px;
}


</style>


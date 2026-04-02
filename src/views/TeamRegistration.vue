<template>
    <div class="container mt-5">
        <h2 class="mb-4 text-center">Team Registration</h2>

        <div class="d-flex justify-content-end gap-2 mb-3">
          <div class="text-end mb-3">
            <button class="btn btn-primary" @click="downloadTeamsPDF">
                Export Teams
            </button>
          </div>
            <!-- Add Team Button -->
            <div class="text-end mb-3">
                <button class="btn btn-primary" @click="toggleAddForm">
                    Add Team
                </button>
            </div>
            <div v-if="isOscar" class="text-end mb-3">
                <button class="btn btn-primary" @click="toggleRemoveForm">
                    Remove Team
                </button>
            </div>
        </div>

        <div class="row mt-4">
            <div class="col-md-12 mb-4">
                <h4 class="mb-3">
                    Team List
                </h4>

                <div class="table-container shadow-lg rounded overflow-hidden">
                    <div class="table-responsive">
                        <table class="table table-striped table-hover">
                            <thead class="thead-light">
                                <tr>
                                    <th v-for="header in tableHeaders" :key="header.key" class="text-left">
                                        {{ header.label }}
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-if="filteredTeamData.length === 0">
                                    <!-- Colspan should match the number of dynamic headers -->
                                    <td :colspan="tableHeaders.length" class="alert alert0info p-2 text-center">
                                        No Teams Available
                                    </td>
                                </tr>
                                <tr 
                                    v-for="(item, index) in filteredTeamData" 
                                    :key="item.id || index" 
                                    @click="openEditTeamForm(item)" 
                                    style="cursor: pointer;"
                                >
                                    <td v-for="header in tableHeaders" :key="header.key" class="text-center">
                                        <span v-if="header.key === 'participants'">
                                            {{ formatParticipants(item.participants) }}
                                        </span>
                                        <span v-else>
                                            {{ item[header.key] }}
                                        </span>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>


        <!-- Add New Team Modal -->
        <div v-if="showAddForm" class="popup-overlay">
            <div class="card p-4 popup">
                <header class="mb-4 text-center border-bottom pb-3">
                    <h5>Add New Team</h5>
                </header>

                <!-- Error/Success Alert Structure -->
                <div v-if="error || success" :class="['alert p-2 mb-3', error ? 'alert-danger' : 'alert-success']" role="alert">
                    <i class="bi bi-info-circle-fill"></i> {{ error || success }}
                </div>

                <form @submit.prevent="handleAddTeam">
                    <div v-if="addFormError" class="alert alert-danger p-2 mb-3">
                        <i class="bi bi-exclamation-triangle-fill"></i> {{ addFormError }}
                    </div>
                    
                    <!-- Team Name -->
                    <div class="mb-3">
                        <label class="form-label">Team Name *</label>
                        <input v-model="formData.teamName" type="text" class="form-control" required />
                    </div>
                    
                    <!-- Project Name -->
                    <div class="mb-3">
                        <label class="form-label">Project Name</label>
                        <input v-model="formData.projectName" type="text" class="form-control"/>
                    </div>
                    
                    <!-- Project Description -->
                    <div class="mb-3">
                        <label class="form-label">Project Description</label>
                        <textarea v-model="formData.projectDescription" class="form-control"></textarea>
                    </div>
                    
                    <!-- Presentation Link -->
                    <div class="mb-3">
                        <label class="form-label">Presentation Link</label>
                        <input v-model="formData.presentationLink" type="text" class="form-control"/>
                    </div>
                    
                    <!-- GitHub Link -->
                    <div class="mb-3">
                        <label class="form-label">GitHub Link</label>
                        <input v-model="formData.githubLink" type="text" class="form-control"/>
                    </div>
                    
                    <!-- Participants Selection -->
                    <div class="mb-4">
                        <label class="form-label">Initial Participants (Select {{ MIN_PARTICIPANTS }} or more) *</label>
                        <div v-if="loading && showAddForm" class="text-info fst-italic">Loading participants...</div>
                        <div v-else-if="checkedInUnassignedUsers.length > 0">
                            <select 
                                v-model="selectedParticipantsIds" 
                                multiple 
                                class="form-control"
                                required
                                :size="Math.min(10, checkedInUnassignedUsers.length + 1)"
                            >
                                <option 
                                    v-for="p in checkedInUnassignedUsers" 
                                    :key="p.id" :value="p.id" >
                                    {{ formatParticipants(p) }}
                                </option>
                            </select>
                            <div class="form-text text-muted">Hold Ctrl (Cmd on Mac) to select multiple participants.</div>
                        </div>
                        
                        <p v-else class="text-muted small p-2 bg-light rounded">
                            No unassigned participants available to form a new team.
                        </p>
                    </div>
                    
                    <!-- Action Buttons -->
                    <div class="d-flex justify-content-end gap-2">
                        <button type="button" class="btn btn-secondary" @click="handleCancel">
                            Cancel
                        </button>
                        <button 
                            type="submit" 
                            class="btn btn-success"
                            :disabled="loading || !isTeamMinMet"
                        >
                            <span v-if="loading">Submitting...</span>
                            <span v-else>Submit</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>

        <!-- Remove Team Modal -->
         <div v-if="showRemoveForm && isOscar" class="popup-overlay">
            <div class="card p-4 popup">
                <header class="modal-header">
                    <h5 class="modal-title text-danger">Confirm Team Deletion</h5>
                    <button type="button" class="btn-close" @click="cancelRemove"></button>
                </header>

                <form @submit.prevent="handleRemoveTeam">
                    <div v-if="removeFormError" class="alert alert-danger p-2 mb-3" role="alert">
                        <i class="bi bi-exclamation-triangle-fill"></i> {{ removeFormError }}
                    </div>

                    <p class="alert alert-warning">
                        ⚠️ **WARNING:** This will permanently delete the team.
                        All assigned participants will become unassigned. This cannot be undone.
                    </p>
                    
                    <p>To confirm deletion, please select the team name:</p>
                    
                    <div class="mb-3">
                        <label class="form-label">Select Team to Delete *</label>
                        <select v-model="teamIdForDeletion" class="form-control" required @change="updateTeamNameForDeletion">
                            <option :value="null" disabled>-- Select a Team --</option>
                            <option v-for="team in teams" :key="team.id" :value="team.id">
                                {{ team.teamName }}
                            </option>
                        </select>
                    </div>
                    
                    <div class="modal-footer justify-content-end">
                        <button type="button" class="btn btn-secondary" @click="cancelRemove">
                            Cancel
                        </button>
                        <button 
                            type="submit" 
                            class="btn btn-danger ms-2" 
                            :disabled="isDeleteButtonDisabled"
                        >
                            <span v-if="loading">Deleting...</span>
                            <span v-else>Confirm Delete</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
        
        <!-- Edit Team Modal -->
        <div v-if="showEditForm" class="popup-overlay">
            <div class="card p-4 popup">
                
                <header class="modal-header">
                    <h5 class="modal-title">Edit Team: {{ editFormData.teamName }}</h5>
                    <button type="button" class="btn-close" @click="cancelEdit"></button>
                </header>
                
                <div class="modal-body">
                    <div v-if="error || success" :class="['alert p-2 mb-3', error ? 'alert-danger' : 'alert-success']" role="alert">
                        <i class="bi bi-info-circle-fill"></i> {{ error || success }}
                    </div>
                    
                    <form @submit.prevent="handleUpdateTeam" id="editTeamForm"> 
                        <div v-if="editFormError" class="alert alert-danger p-2 mb-3">
                            <i class="bi bi-exclamation-triangle-fill"></i> {{ editFormError }}
                        </div>
                        
                        <div class="mb-3">
                            <label class="form-label">Team Name *</label>
                            <input v-model="editFormData.teamName" type="text" class="form-control" required />
                        </div>
                        
                        <div class="mb-3">
                            <label class="form-label">Project Name</label>
                            <input v-model="editFormData.projectName" type="text" class="form-control"/>
                        </div>
                        
                        <div class="mb-3">
                            <label class="form-label">Project Description</label>
                            <textarea v-model="editFormData.projectDescription" class="form-control"></textarea>
                        </div>
                        
                        <div class="mb-3">
                            <label class="form-label">Presentation Link</label>
                            <input v-model="editFormData.presentationLink" type="text" class="form-control"/>
                        </div>
                        
                        <div class="mb-3">
                            <label class="form-label">GitHub Link</label>
                            <input v-model="editFormData.githubLink" type="text" class="form-control"/>
                        </div>
                        
                        <div class="mb-4">
                            <label class="form-label">Team Participants (Select {{ MIN_PARTICIPANTS }} or more) *</label>
                            
                            <div v-if="loading && showEditForm" class="text-info fst-italic">Loading participants...</div>
                            <div v-else-if="allAvailableUsers.length > 0">
                                <select 
                                    v-model="editSelectedParticipantsIds" 
                                    multiple 
                                    class="form-control"
                                    required
                                    :size="Math.min(10, allAvailableUsers.length + 1)"
                                >
                                    <option 
                                        v-for="p in allAvailableUsers" 
                                        :key="p.id" :value="p.id" >
                                        {{ formatParticipants(p) }}
                                    </option>
                                </select>
                                <div class="form-text text-muted">Hold Ctrl (Cmd on Mac) to select multiple participants.</div>
                            </div>
                            
                            <p v-else class="text-muted small p-2 bg-light rounded">
                                No participants available.
                            </p>
                        </div>
                    </form>
                </div>
                
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" @click="cancelEdit">
                        Cancel
                    </button>
                    <button 
                        type="submit" 
                        form="editTeamForm"
                        class="btn btn-primary"
                        :disabled="loading || !isTeamMinMetForEdit"
                    >
                        <span v-if="loading">Saving...</span>
                        <span v-else>Save Changes</span>
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import axios from "axios";
import store from "../store/store.js";
const API_BASE_URL = `${store.state.apiBaseUrl}`;

export default{
    name: "TeamRegistration",
    data(){
        return {
            teams: [],
            users: [],
            unassignedUsers: [],

            showEditForm: false,
            editFormData: {},
            editSelectedParticipantsIds: [],
            editTeamId: null,
            editFormError: null,

            showAddForm: false, // Controls modal visibility
            addFormError: false,

            showRemoveForm: false,
            removeFormError: null,
            teamIdForDeletion: null,
            teamNameForDeletion: null,
            showTeamSelectForDelete: false,

            formData: {
                teamName: '',
                projectName: '',
                projectDescription: '',
                presentationLink: '',
                githubLink: '',
                eventId: 1, // Placeholder
            },
            selectedParticipantsIds: [], // Participants currently selected in the form
            loading: false,
            error: null, // Error message for the Add Form
            success: null, // Success message for the Add Form
            MIN_PARTICIPANTS: 1,
            VISUAL_SLOTS: 4,
        }
    },
    async mounted() {
        await this.$store.dispatch('getActiveEvent'); 
        this.fetchTeams();
        this.fetchUnassignedUsers();
    },
    computed:{
        activeEventId() {
          return this.$store.state.event?.id;
        },
        isOscar(){
            return this.$store.getters.UserRole === 'oscar';
        },
        filteredTeamData() {
            // Since tabs are removed, this always returns teams
            return this.teams;
        },
        tableHeaders() {
            // Since tabs are removed, this always returns the Team List headers
            return [
                { key: 'teamName', label: 'Team Name' },
                { key: 'participants', label: 'Users' },
                { key: 'projectName', label: 'Project Name' },
                { key: 'projectDescription', label: 'Project Description' },
                { key: 'presentationLink', label: 'Presentation Link' },
                { key: 'githubLink', label: 'GitHub Link' },
            ];
        },
        checkedInUnassignedUsers(){
            // Retained for use in the Add Team modal
            return this.unassignedUsers;
        },
        isTeamMinMet() {
            return this.selectedParticipantsIds.length >= this.MIN_PARTICIPANTS;
        },
        isTeamMinMetForEdit(){
            return this.editSelectedParticipantsIds.length >= this.MIN_PARTICIPANTS;
        },
        allAvailableUsers(){
            const currentTeamMembers = this.editFormData.participants || [];
            const unassigned = this.unassignedUsers;

            const uniqueUsersMap = new Map();
            [...currentTeamMembers, ...unassigned].forEach(user => {
                if(user && user.id){
                    uniqueUsersMap.set(user.id, user);
                }
            });

            return Array.from(uniqueUsersMap.values())
                .filter(user => user.isBanned !== true && user.isBanned !== 1)
                .sort((a, b) => {
                const nameA = a.lastName || a.firstName || '';
                const nameB = b.lastName || b.firstName || '';
                return nameA.localeCompare(nameB);
            });
        },
        isDeleteButtonDisabled() {
            return !this.teamIdForDeletion || this.loading;
        }
    },
    created() {
        this.fetchTeams();
        this.fetchUnassignedUsers();
    },
    methods: {
        async fetchTeams() {
            const eventId = this.activeEventId;
            try {
                // 2. Use the new endpoint and append eventId as a query parameter                
                const response = await axios.get(`${API_BASE_URL}/teams/all?eventId=${eventId}`);
                this.teams = response.data.data;
            } catch(err) {
                console.error("Error fetching teams: ", err.response?.data?.message || err.message);
            }
        },
        formatParticipants(participants){
            if (!participants) {
                return 'No members assigned';
            }

            let participantsArray = participants;
            
            if (!Array.isArray(participants) && typeof participants === 'object') {
                participantsArray = [participants];
            }else if (!Array.isArray(participants)) {
                console.warn("Participants data received in an unexpected non-array, non-object format:", participants);
                return 'Data error';
            }
            
            const displayArray = participantsArray.filter(p => p.isBanned !== true && p.isBanned !== 1);

            if (displayArray.length === 0) {
                return 'No members assigned';
            }

            return displayArray.map(p => {
                const firstName = p?.firstName || '';
                const lastName = p?.lastName || '';
                const name = p?.name;
                const id = p?.id;

                if (firstName && lastName) {
                    return `${firstName} ${lastName}`;
                }
                if (name) {
                    return name;
                }
                return `ID: ${id || 'Unknown'}`;
            }).join(', ');
        },
        async fetchUnassignedUsers(){
            try{
                const res = await axios.get(`${API_BASE_URL}/teams/unassignedParticipants`);

                this.unassignedUsers = res.data.data
                    .filter(participant => participant.isBanned !== true && participant.isBanned !== 1)
                    .map(participant => {
                    return {
                        id: participant.id,
                        firstName: participant.firstName,
                        lastName: participant.lastName,
                        email: participant.email,
                        checkIn: participant.checkIn === true || participant.checkIn === 1, 
                        isBanned: participant.isBanned === true || participant.isBanned === 1,
                    };
                });
            }catch(err){
                console.error("Error fetching unassigned users:", err);
            }
        },
        updateTeamNameForDeletion() {
            const selectedTeam = this.teams.find(t => t.id === this.teamIdForDeletion);
            this.teamNameForDeletion = selectedTeam ? selectedTeam.teamName : null;
        },
        handleUserBanned(bannedUserId){
            this.teams - this.teams.map(team => {
                team.participants = team.participants.filter(p => p.id !== bannedUserId)
                return team;
            });

            this.unassignedUsers = this.unassignedUsers.filter(p => p.id !== bannedUserId)
        },
        openEditTeamForm(item) {
          this.error = null;
          this.success = null;
          this.editFormError = null;

          this.showAddForm = false;

          this.editTeamId = item.id;
          this.editFormData = { ...item };

          this.editSelectedParticipantsIds = item.participants ? item.participants.map(p => p.id) : [];

          this.showEditForm = true;
        },

        cancelEdit(){
            this.showEditForm = false;
            this.editFormData = {};
            this.editSelectedParticipantsIds = [];
            this.editTeamId = null;
            this.editFormError = null;
            this.loading = false;
            this.error = null;
            this.success = null;
        },

        async handleUpdateTeam(){
            this.loading = true;
            this.editFormError = null;

            if(!this.isTeamMinMetForEdit){
                this.editFormError = `Team must have at least ${this.MIN_PARTICIPANTS} participant(s).`;
                this.loading = false;
                return;
            }

            try{
                const teamId = this.editTeamId;
                const payload = {
                    ...this.editFormData,
                    participantIds: this.editSelectedParticipantsIds,
                };

                const response = await axios.put(`${API_BASE_URL}/teams/${teamId}`, payload);
                this.success = response.data.message || 'Team updated successfully!';

                await this.fetchTeams();
                await this.fetchUnassignedUsers();

                setTimeout(() => {
                    this.cancelEdit();
                    this.success = null;
                }, 1500);
            }catch(err){
                this.editFormError = err.response?.data?.message || "Failed to update team. Please check the form and try again.";
            }
        },

        // --- Add Team Modal Methods ---

        async toggleAddForm() {
            this.showAddForm = true;
            this.addFormError = null;
            this.showRemoveForm = false;

            this.loading = true; 
            await this.fetchUnassignedUsers();
            this.loading = false;
        },
        async downloadTeamsPDF() {
          try {
            const eventId = this.activeEventId;
            const response = await axios.get(`${API_BASE_URL}/puppeteer/teamPDF/${eventId}`,{
              responseType: 'blob',
            });

            const fileURL = window.URL.createObjectURL(new Blob([response.data], {type: 'application/pdf'}));

            const fileLink = document.createElement('a');
            fileLink.href = fileURL;
            fileLink.setAttribute('download', 'JudgeTeams.pdf');

            document.body.appendChild(fileLink);
            fileLink.click()

            document.body.removeChild(fileLink);
            window.URL.revokeObjectURL(fileURL);
          } catch(err) {
            console.error("Error exporting team: ", err);
            this.error = err.response?.data?.message || err.response?.data?.error || "Failed to export teams.";

          }
        },
        handleCancel() {
            // Reset form state and close modal
            this.formData = {
                teamName: '',
                projectName: '',
                projectDescription: '',
                presentationLink: '',
                githubLink: '',
                eventId: 1,
            };
            this.selectedParticipantsIds = [];
            this.loading = false;
            this.showAddForm = false;
            this.addFormError = null; 
        },
        async handleAddTeam() {
            this.addFormError = null;
            this.error = null;
            this.success = null;
            
            // Client-side validation: Check minimum participants
            if (!this.isTeamMinMet) {
                this.addFormError = `Team must have at least ${this.MIN_PARTICIPANTS} participant(s).`;
                return;
            }
            
            this.loading = true;

            // Prepare the payload
            const teamPayload = {
                ...this.formData,
                // Send only the User IDs for assignment
                participantIds: this.selectedParticipantsIds, 
            };

            try {
                // --- Actual API Call (Uncomment when API is ready) ---
                const response = await axios.post(`${API_BASE_URL}/teams/create`, teamPayload);
                
                this.success = `Team '${this.formData.teamName}' successfully registered and ${teamPayload.participantIds.length} members assigned!`;
                
                // Re-fetch the data to update the lists
                this.fetchTeams();
                this.fetchUnassignedUsers();


            } catch (err) {
                console.error("Error adding team: ", err);
                this.error = err.response?.data?.message || err.response?.data?.error || "Failed to register team. Please check the form and try again.";
            } finally {
                this.loading = false;
            }
        },
        toggleRemoveForm(){
            this.showEditForm = false;
            this.showRemoveForm = true;
            this.removeFormError = null;
            this.teamIdForDeletion = null;
            this.teamNameForDeletion = null;
        },
        cancelRemove(){
            this.showRemoveForm = false;
            this.removeFormError = null;
            this.teamIdForDeletion = null;
            this.teamNameForDeletion = null;
            this.loading = false;
        },
        async handleRemoveTeam() {
            this.loading = true;
            this.removeFormError = null;

            if (!this.teamIdForDeletion) {
                this.removeFormError = "Please select a team to delete.";
                this.loading = false;
                return;
            }

            try {
                // API call to delete the team using the stored editTeamId
                const response = await axios.delete(`${API_BASE_URL}/teams/${this.teamIdForDeletion}`);
                
                this.success = response.data.message || `Team '${this.editFormData.teamName}' successfully deleted.`;
                
                // Cleanup: Re-fetch the lists and close all modals
                await this.fetchTeams();
                await this.fetchUnassignedUsers();
                
                setTimeout(() => {
                    this.cancelEdit(); // Clears all edit-related state
                    this.cancelRemove(); // Clears remove-related state
                    this.success = null;
                }, 1500);

            } catch (err) {
                console.error("Error removing team:", err);
                this.removeFormError = err.response?.data?.message || "Failed to delete team due to an API error.";
            } finally {
                this.loading = false;
            }
        },
    }
}
</script>

<style scoped>
.container {
  max-width: 100%;
  position: relative;
}

/* Removed nav-tabs and nav-link styles as tabs are gone */

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
  width: 100%;
}

.table th, .table td{

    word-break: break-word;
    white-space: normal;
}

.thead-light th {
  background-color: #f8f9fa;
  color: #495057;
  font-weight: 600;
  vertical-align: middle;
  text-align: center;
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

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: #fff;
  padding: 20px;
  border-radius: 8px;
  width: 400px;
  max-width: 90%;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.mb-4 {
  margin-bottom: 1.5rem !important;
}

.btn {
  font-size: 0.875rem;
}

.btn-primary {
  background-color: #007bff;
  border-color: #007bff;
}

.btn-primary:hover {
  background-color: #0056b3;
  border-color: #004085;
}

.btn-outline-secondary:hover {
  background-color: #6c757d;
  color: white;
}

.btn-outline-danger:hover {
  background-color: #dc3545;
  color: white;
}

.popup-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1050;
}

.popup {
  max-width: 400px;
  width: 100%;

  max-height: 90vh;
  overflow-y: auto;

  padding-bottom: 20px;
}
</style>

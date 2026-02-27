<template>
  <div class="container mt-5">
    <h2 class="mb-4 text-center">Hardware List</h2>

    <button @click="openAddModal" class="btn btn-primary add-hardware-btn">
      Add Hardware
    </button>

    <div class="table-container shadow-lg rounded overflow-hidden mt-3">
      <div class="table-responsive">
        <table class="table table-striped table-hover">
          <thead class="table-dark">
          <tr>
            <th>Name</th>
            <th>Image</th>
            <th>Serial Number</th>
            <th>Functional</th>
            <th>Description</th>
            <th>Actions</th>
          </tr>
          </thead>

          <tbody>
          <tr v-if="hardwareList.length === 0">
            <td colspan="6" class="text-center">No hardware available</td>
          </tr>

          <tr v-for="hardware in hardwareList" :key="hardware.id">
            <td>{{ hardware.name }}</td>

            <td>
              <img
                  v-if="hardware.images && hardware.images.length > 0"
                  :src="hardware.images[0].imageUrl"
                  :alt="`${hardware.name} Image`"
                  class="hardware-img"
              />
              <span v-else class="text-muted">No image</span>
            </td>

            <td>{{ hardware.serial }}</td>

            <td>
                <span
                    class="badge"
                    :class="hardware.functional ? 'bg-success' : 'bg-danger'"
                >
                  {{ hardware.functional ? "Functional" : "Not Functional" }}
                </span>
            </td>

            <td>{{ hardware.description }}</td>

            <td>
              <button
                  @click="editHardware(hardware)"
                  class="btn btn-warning btn-sm me-2"
              >
                Edit
              </button>
              <button
                  @click="deleteHardware(hardware.id)"
                  class="btn btn-danger btn-sm"
              >
                Delete
              </button>
            </td>
          </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div v-if="showHardwareModal" class="modal-overlay">
      <div class="modal-content">
        <h3>{{ isEditing ? "Edit Hardware" : "Add Hardware" }}</h3>

        <form @submit.prevent="saveHardware">

          <div class="form-group">
            <label for="hardwareName">Hardware Name</label>
            <input
                type="text"
                id="hardwareName"
                v-model="hardwareForm.hardwareName"
                class="form-control"
                required
            />
          </div>

          <div class="form-group mt-2">
            <label for="hardwareSerial">Serial Number</label>
            <input
                type="text"
                id="hardwareSerial"
                v-model="hardwareForm.serial"
                class="form-control"
                required
            />
          </div>

          <div class="form-group mt-2">
            <label for="hardwareWhoHasId">ID of Individual</label>
            <input
                type="text"
                id="hardwareSerial"
                v-model="hardwareForm.whoHasId"
                class="form-control"
                placeholder="Add the User ID if returning then input none"
            />
          </div>

          <div class="form-group mt-3">
            <label>Functional</label>
            <div class="btn-group d-flex" role="group">
              <button
                  type="button"
                  class="btn"
                  :class="hardwareForm.functional ? 'btn-success' : 'btn-outline-success'"
                  @click="hardwareForm.functional = true"
              >
                Yes
              </button>

              <button
                  type="button"
                  class="btn"
                  :class="!hardwareForm.functional ? 'btn-danger' : 'btn-outline-danger'"
                  @click="hardwareForm.functional = false"
              >
                No
              </button>
            </div>
          </div>

          <div class="form-group mt-2">
            <label for="hardwareDescription">Description</label>
            <textarea
                id="hardwareDescription"
                v-model="hardwareForm.description"
                class="form-control"
            ></textarea>
          </div>

          <div class="form-group mt-3">
            <label>Upload Image</label>
            <input type="file" @change="onFileChange" class="form-control" accept="image/*" />

            <div v-if="previewImageUrl" class="mt-2 text-center">
              <img :src="previewImageUrl" class="preview-img" alt="Image Preview" />
            </div>
          </div>

          <div class="modal-actions mt-4">
            <button type="submit" class="btn btn-success me-2" :disabled="isUploading">
              {{ isUploading ? 'Uploading...' : (isEditing ? "Update" : "Save") }}
            </button>
            <button type="button" class="btn btn-secondary" @click="closeModal" :disabled="isUploading">
              Cancel
            </button>
          </div>

        </form>
      </div>
    </div>

  </div>
</template>

<script>
import axios from "axios";
import store from "../store/store.js";

export default {
  name: "HardwareTab",

  data() {
    return {
      hardwareList: [],
      showHardwareModal: false,
      isEditing: false,
      isUploading: false, // New state for better UX
      selectedFile: null,

      hardwareForm: {
        id: null,
        hardwareName: "", // Updated field name to match backend/database structure
        serial: "",
        functional: true,
        description: "",
        whoHasId: "",
        // We no longer store imageUrl here, as hardware can have multiple images.
        // The one used for preview is handled by a computed property.
      },
      // Keep track of the current primary image URL for editing preview
      currentPrimaryImageUrl: null,
    };
  },

  // Computed property to determine the correct image source for the modal preview
  computed: {
    previewImageUrl() {
      // 1. Show preview of the newly selected file (FileReader)
      if (this.selectedFile) {
        return URL.createObjectURL(this.selectedFile);
      }
      // 2. Show the existing primary image URL if editing
      return this.currentPrimaryImageUrl;
    }
  },

  created() {
    this.fetchHardwareList();
  },

  methods: {
    // --- Data Fetching ---
    async fetchHardwareList() {
      try {
        const response = await axios.get(
            `${store.state.apiBaseUrl}/hardware/admin`
        );

        const raw = response.data.hardware || response.data;

        // NOTE: The backend needs to return 'hardwareName', 'serial', 'functional',
        // 'description', and an 'images' array (from the HardwareRepo update)
        this.hardwareList = raw.map(item => ({
          id: item.hardwareId || item.id,
          name: item.hardwareName,
          serial: item.serial,
          functional: item.functional ?? true,
          description: item.description || "",
          whoHasId: item.whoHasId || "",
          // Access the images array returned by the repository's 'include'
          images: item.images || [],
        }));

      } catch (error) {
        console.error("Error fetching hardware:", error);
      }
    },

    // --- Modal and Form Handling ---
    openAddModal() {
      this.resetForm();
      this.isEditing = false;
      this.showHardwareModal = true;
    },

    editHardware(hardware) {
      this.isEditing = true;

      // Map the data structure to the form structure
      this.hardwareForm = {
        id: hardware.id,
        hardwareName: hardware.name, // Use the correct field name for the backend
        serial: hardware.serial,
        functional: hardware.functional,
        description: hardware.description,
        whoHasId: hardware.whoHasId,
      };

      // Set the existing image URL for preview
      this.currentPrimaryImageUrl = hardware.images.length > 0
          ? hardware.images[0].imageUrl
          : null;

      this.selectedFile = null;
      this.showHardwareModal = true;
    },

    // --- File Handling ---
    onFileChange(e) {
      // Reset current primary image URL if a new file is selected
      this.currentPrimaryImageUrl = null;
      this.selectedFile = e.target.files[0];
    },

    // --- Image Upload Logic (Step 1) ---
    async uploadImageIfNeeded() {
      if (!this.selectedFile) {
        return null; // No new image to upload
      }

      this.isUploading = true;

      const formData = new FormData();
      // 'image' must match your upload controller's .single('image') key
      formData.append("image", this.selectedFile);

      try {
        const {data} = await axios.post(
            `${store.state.apiBaseUrl}/api/upload`,
            formData,
            {headers: {'Content-Type': 'multipart/form-data'}}
        );
        return data.imageUrl; // The public DO Space URL
      } catch (e) {
        console.error("Image upload failed:", e);
        throw new Error("Failed to upload image to DigitalOcean Space.");
      } finally {
        this.isUploading = false;
      }
    },

    // --- Form Submission (Step 2 & DB Save) ---
    async saveHardware() {
      if (this.isUploading) return;

      try {
        // Step 1: Upload image if a new one was selected
        const newImageUrl = await this.uploadImageIfNeeded();

        // 1. Construct the payload for the Hardware table
        const hardwarePayload = {
          // Use the correct field names for the backend: hardwareName, serial, functional, description
          hardwareName: this.hardwareForm.hardwareName,
          serial: this.hardwareForm.serial,
          functional: this.hardwareForm.functional,
          description: this.hardwareForm.description,
          whoHasId:
              this.hardwareForm.whoHasId === "" ||
              this.hardwareForm.whoHasId.toLowerCase() === "none" ? null : Number(this.hardwareForm.whoHasId),
        };

        let hardwareResponse;

        // Step 2a: UPDATE
        if (this.isEditing) {
          hardwareResponse = await axios.put(
              `${store.state.apiBaseUrl}/hardware/update/${this.hardwareForm.id}`,
              hardwarePayload
          );
        }

        // Step 2b: CREATE NEW
        else {
          hardwareResponse = await axios.post(`${store.state.apiBaseUrl}/hardware/add`, hardwarePayload);
        }

        // Step 3: Link the new image to the created/updated hardware
        if (newImageUrl) {
          // Determine the hardware ID: use the ID from the form (edit) or the new ID from the response (create)
          const hardwareId = this.isEditing ? this.hardwareForm.id : hardwareResponse.data.id;

          // NOTE: This assumes your /hardware/add endpoint returns the ID of the new hardware item.

          // Call the controller to save the URL to the HardwareImage table
          await axios.post(`${store.state.apiBaseUrl}/hardware/image/add`, {
            imageUrl: newImageUrl,
            hardwareId: hardwareId
          });
        }

        await this.fetchHardwareList();
        this.closeModal();

      } catch (error) {
        console.error("Error saving hardware:", error);
        alert('Failed to save hardware. Check console for details.');
      }
    },

    // --- Other Methods (Minor fixes) ---
    async deleteHardware(id) {
      if (!confirm("Are you sure you want to delete this hardware?")) return;

      try {
        // You should also delete the associated images from DO Space here for cleanup,
        // but that requires a separate backend endpoint.
        await axios.delete(`${store.state.apiBaseUrl}/hardware/delete/${id}`);
        await this.fetchHardwareList();
      } catch (error) {
        console.error("Error deleting hardware:", error);
      }
    },

    closeModal() {
      this.showHardwareModal = false;
      this.resetForm();
    },

    resetForm() {
      this.hardwareForm = {
        id: null,
        hardwareName: "",
        serial: "",
        functional: true,
        description: "",
        whoHasId: ""
      };
      this.selectedFile = null;
      this.currentPrimaryImageUrl = null;
    },
  },
};
</script>

<style scoped>
/* Styles remain the same */
.add-hardware-btn {
  float: right;
  margin-bottom: 10px;
}

.hardware-img {
  width: 80px;
  height: auto;
  border-radius: 6px;
  object-fit: cover;
}

.preview-img {
  width: 140px;
  height: auto;
  border-radius: 8px;
  border: 1px solid #ccc;
  margin-top: 5px;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
}

.modal-content {
  background: #fff;
  padding: 20px;
  border-radius: 10px;
  width: 500px;
  max-height: 85vh;
  overflow-y: auto;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
}
</style>
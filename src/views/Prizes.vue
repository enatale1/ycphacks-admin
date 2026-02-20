<template>
  <div class="container mt-5">
    <h2 class="mb-4 text-center">Categories</h2>

    <div class="d-flex justify-content-end gap-2 mb-3">
      <!-- Add Category Button -->
      <div v-if="isOscar" class="text-end mb-3">
        <button class="btn btn-primary" @click="toggleAddCategoryForm">
          Add Category
        </button>
      </div>

      <!-- Remove Category Button -->
      <div v-if="isOscar" class="text-end mb-3">
        <button class="btn btn-primary" @click="toggleRemoveCategoryForm">
          Remove Category
        </button>
      </div>
    </div>

    <!-- Add Category Form -->
    <!-- This really only has the name, but will eventually have the subcategories -->
    <!-- Considering making the prizes be added directly within the category form -->
    <div v-if="showAddCategoryForm" class="popup-overlay">
      <div class="card p-3 popup">
        <h5>Add Category</h5>
        <form @submit.prevent="handleAddCategory">
          <div v-if="addCategoryFormError" class="alert alert-danger p-2 mb-3" role="alert">
            <i class="bi bi-exclamation-triangle-fill"></i> {{ addCategoryFormError }}
          </div>
          <div class="mb-2">
            <label class="form-label">Name</label>
            <input v-model="currentAddCategoryName" type="text" class="form-control" required/>
          </div>
          <div class="d-flex justify-content-end gap-2 mt-3">
            <button type="button" class="btn btn-secondary" @click="cancelAddCategory">
              Cancel
            </button>
            <button type="submit" class="btn btn-success">Submit</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Remove Category Form -->
    <div v-if="showRemoveCategoryForm && isOscar" class="popup-overlay">
      <div class="card p-3 popup">
        <h5>Remove Category</h5>
        <form @submit.prevent="handleRemoveCategory">
          <div v-if="removeCategoryFormError" class="alert alert-danger p-2 mb-3" role="alert">
            <i class="bi bi-exclamation-triangle-fill"></i> {{ removeCategoryFormError }}
          </div>
          <p class="alert alert-warning">
            <strong>⚠️ Are you absolutely sure?</strong> 
            This will permanently delete the tier and cannot be undone.
          </p>
          
          <p>Please confirm the name of the tier you wish to delete:</p>
          <div class="mb-2">
            <label class="form-label">Name</label>
            <input v-model="removeCategoryName" type="text" class="form-control" />
          </div>
          
          <button type="button" class="btn btn-secondary" @click="cancelRemoveCategory">
            Cancel
          </button>
          
          <button type="submit" class="btn btn-danger ms-2" :disabled="isDeleteButtonDisabled">
            Confirm Delete
          </button>
        </form>
      </div>
    </div>

    <!-- Edit Category Popup -->
    <div v-if="showEditCategoryForm && isOscar" class="popup-overlay">
      <div class="card p-3 popup" :key="currentEditCategoryId">
        <h5>Edit Category</h5>
        <form @submit.prevent="handleUpdateCategory">
          <div v-if="editCategoryFormError" class="alert alert-danger p-2 mb-3" role="alert">
            <i class="bi bi-exclamation-triangle-fill"></i> {{ editCategoryFormError }}
          </div>
          <div class="mb-2">
            <label class="form-label">Category Name</label>
            <input v-model="currentEditCategoryName" type="text" class="form-control" required />
          </div>
          <div class="d-flex justify-content-end gap-2">
            <button type="button" class="btn btn-secondary" @click="cancelEditCategory">
              Cancel
            </button>
            <button type="submit" class="btn btn-success">Save</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Categorises Tables -->
    <div class="col-md-12 mb-4" v-for="categoryData in categories" :key="categoryData.id" style="padding-bottom: 5vw">
      <h4 class="mb-3">{{categoryData.categoryName}}</h4>

      <div class="table-container shadow-lg rounded overflow-hidden">
        <div class="table-responsive">
          <table class="table table-striped table-hover">
            <thead class="thead-light">
              <tr>
                <th class="text-left">Prizes</th>
              </tr>
            </thead>
            <tbody>
              <tr> <!--v-if="categories.length === 0">-->
                <td colspan="2" class="alert alert-info p-2 text-center">No prizes yet</td>
              </tr>

<!--              &lt;!&ndash; @click="openEditCategoryForm(categoryData)" &ndash;&gt;-->
<!--              <tr v-for="" :key=""  style="cursor: pointer;">-->
<!--              </tr>-->
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import { useStore } from 'vuex';
import axios from "axios";

const store = useStore();

// List of categories
const categories = ref([]);
// const tiers = ref([]);
const currentEventId = ref(null);

// Category Form states
const showAddCategoryForm = ref(false);
const showRemoveCategoryForm = ref(false);
const showEditCategoryForm = ref(false);

const currentAddCategoryName = ref("");
const addCategoryFormError = ref(null);

const currentEditCategoryId = ref(null);
const currentEditCategoryName = ref(null);
const currentEditCategoryEventId = ref(null);
const editCategoryFormError = ref(null);

const removeCategoryName = ref("");
const currentRemoveCategoryId = ref(null);
const removeCategoryFormError = ref(null);


// Validate Characters
const validateName = (name) => {
  // Regex restricts input to standard keyboard characters:
  // letters (a-z), numbers (0-9), space (\s), and common punctuation in company names.
  // The 'i' flag makes it case-insensitive (a-zA-Z).
  const allowedChars = /^[a-zA-Z0-9\s\-.()'&!@#$%,]+$/;
  // ^ may change later since this is for categories ^

  // If the name is empty, we let the 'required' attribute handle it.
  if (!name) return null;

  if (!allowedChars.test(name)) {
    return "Category Name contains restricted characters. Please use only standard letters, numbers, spaces, and common symbols (e.g., -, ., ', &, @, #).";
  }
  return null;// what's the difference between this null and the name not being given null?
};


// Checks if the user is oscar level
const isOscar = computed(() => {
    return store.getters.UserRole === 'oscar';
});

const isDeleteButtonDisabled = computed(() => {
  const enteredName = removeCategoryName.value.trim();

  // Checks if it's blank -> should be grayed out
  if(enteredName === '') return true;

  const categoryExists = categories.value.some(category => {
    // Checks if the name exists
    return category.categoryName.toLowerCase() === enteredName.toLocaleLowerCase();
  });

  return !categoryExists;
});

// and prizes once i get this up and running
const fetchCategories = async () => {
  try{
    let eventId = null;

    const activeEvent = await store.dispatch('getActiveEvent');

    if (activeEvent.success) {
      eventId = store.getters.getEvent.id;
    }
    else
    {
      console.warn("Could not determine current event ID. Cannot fetch categories.");
      categories.value = [];
      return;
    }

    currentEventId.value = eventId;
    const getEventCategoriesSuccess = await store.dispatch('getCategoriesForEvent', eventId);

    if (!getEventCategoriesSuccess.success) {
      console.warn("Could not get categories from event ID.");
      categories.value = [];
      return;
    }

    const categoriesForEvent = store.getters.getCategories;
    categories.value = Array.isArray(categoriesForEvent)
      ? categoriesForEvent.map(s => ({
          id: s.id,
          categoryName: s.categoryName,
          eventId: s.eventId
        })) : [];
  }
  catch (err){
      console.error("Error fetching categories: ", err);
  }
}

// Fetch categories on load
onMounted(async () => {
    await fetchCategories();
    await store.dispatch('getActiveEvent');
});

// Toggle Category Forms
const toggleAddCategoryForm = async () => {
  showAddCategoryForm.value = !showAddCategoryForm.value;
  currentAddCategoryName.value = '';
  addCategoryFormError.value = null;
};

const toggleRemoveCategoryForm = () => {
  showRemoveCategoryForm.value = !showRemoveCategoryForm.value;
  removeCategoryFormError.value = null;
}

// Cancel Category Forms
const cancelAddCategory = () => {
  showAddCategoryForm.value = false;
  currentAddCategoryName.value = '';
  addCategoryFormError.value = null;
}

const cancelEditCategory = () => {
  showEditCategoryForm.value = false;
  currentEditCategoryId.value = null;
  editCategoryFormError.value = null;
}

const cancelRemoveCategory = () => {
    showRemoveCategoryForm.value = false;
    removeCategoryFormError.value = null;
    removeCategoryName.value = "";
}


// Handles Adding Tiers
const handleAddCategory = async () => {
  addCategoryFormError.value = null;

  if(currentAddCategoryName.value === null){
    addCategoryFormError.value = "Name must not be null.";
    return;
  }

  // try{
    const test = await store.dispatch('createCategory', {
      categoryName: currentAddCategoryName.value,
      eventId: currentEventId.value
    });

    console.log(test)

    const resCategories = await store.getters.getCategories;
    categories.value = resCategories === null ? [] : resCategories;

    showAddCategoryForm.value = false;
  // }catch (err){
  //
  //   addCategoryFormError.value = err.response?.data?.error || "Failed to add sponsor tier.";
  // }
}


const handleUpdateCategory = async () => {
    editCategoryFormError.value = null;

    const editCategoryName = Number(currentEditCategoryName);

    if(!editCategoryName.value){
      editCategoryFormError.value = "All fields must be valid. Category Name cannot be empty.";
      return;
    }

    try{
      await store.dispatch('updateCategory', {
        categoryName: editCategoryName.value,
        eventId: currentEventId.value
      });

      const resCategories = await store.getters.getCategories;
      categories.value = resCategories === null ? [] : resCategories;

      showEditCategoryForm.value = false;
  }catch (err){
      editCategoryFormError.value = err.response?.data?.error || "Failed to update sponsor tier.";
  }
}

const handleRemoveCategory = async () => {
  removeCategoryFormError.value = null;

  const categoryToRemove = categories.value.find((s) => s.categoryName === removeCategoryName.value);

  if(!categoryToRemove || !categoryToRemove.id){
    removeCategoryFormError.value = `Sponsor named "${categoryToRemove.categoryName}" was not found. Please check the spelling.`;
    return;
  }

  try {
        const idToDelete = categoryToRemove.id;
        await store.dispatch('deleteCategory', idToDelete);

        const index = categories.value.findIndex((c) => c.id === idToDelete);
        if(index !== -1){
            categories.value.splice(index, 1);
        }

    const resCategories = await store.getters.getCategories;
    categories.value = resCategories === null ? [] : resCategories;

        removeCategoryName.value = "";
        showRemoveCategoryForm.value = false;
    } catch (err) {
        removeCategoryFormError.value = err.response?.data?.message || err.response?.data?.error || "Failed to delete sponsor tier due to a server error.";
    }
};

// Open edit form
const openEditCategoryForm = async (index) => {
    const category = categories.value[index];
    currentEditCategoryId.value = category.id;
    currentEditCategoryName.value = category.categoryName;
    currentEditCategoryEventId.value = category.eventId;
    showEditCategoryForm.value = true;
    editCategoryFormError.value = null;

     try{
      const resCategories = await store.dispatch('getCategoriesForEvent', currentEditCategoryId);
      categories.value = Array.isArray(resCategories.data) ? resCategories.data : [];
    }catch(err){
      console.error("Error fetching categories: ", err);
    }
};

const getCurrentEventId = () => {
    return store.getters.getEvent.id;
}
</script>

<style scoped>
.alert-danger {
    color: #842029;
    background-color: #f8d7da;
    border-color: #f5c2c7;
    border-radius: 0.5rem;
}

.container {
  max-width: 100%;
  position: relative;
}

.table-container {
  border-radius: 0.75rem;
}

.table {
  margin: 0;
  font-size: 0.875rem;
}

.thead-light th {
  background-color: #f8f9fa;
  color: #495057;
  font-weight: 600;
  vertical-align: middle;
  text-align: center;
  white-space: nowrap;
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
}

.col-md-9 .table tbody tr td:nth-child(3){
  word-break: break-all;
  max-width: 200px;
  text-align: left !important;
}

.highlight-name-needs-update {
    /* Subtle background to draw attention */
    background-color: #ffe6e6 !important; 
    /* Prominent text color */
    color: #cc0000 !important;
    font-weight: bold;
    /* Optional: A subtle border on the left of the cell */
    border-left: 3px solid #e74c3c;
}

.preview-img {
  width: 140px;
  height: auto;
  border-radius: 8px;
  border: 1px solid #ccc;
  margin-top: 5px;
}

</style>

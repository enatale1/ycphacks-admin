<template>
  <div class="login-container">
    <div class="login-box">
      <div v-if="isLoading" class="loading-overlay">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
      </div>
      <h2>YCP Hacks Admin Login</h2>
      <form v-if="!isLoading" @submit.prevent="handleSubmit">
        <div class="input-group">
          <label for="email">Email</label>
          <input type="email" id="email" v-model="email" placeholder="you@example.com" required/>
        </div>
        <div class="input-group">
          <label for="password">Password</label>
          <input type="password" id="password" v-model="password" placeholder="********" required/>
        </div>

        <div v-if="showAlert">
          <b-alert
              v-model="showAlert"
              variant="danger"
              class="error-box"
          >
            <span><strong>Error: </strong>{{ message }}</span>
          </b-alert>
        </div>

        <button type="submit" class="login-button">Sign in</button>

        <p class="footer-text" style="margin-top: 15px;">
          <a href="http://localhost:8080/passwordLink">Forgot Password?</a>
        </p>

      </form>
    </div>
  </div>
</template>

<script>
import {mapActions} from "vuex";
import store from "@/store/store.js";

export default {
  name: "Login",
  data() {
    return {
      email: "",
      password: "",
      showPassword: false,
      isLoading: false,
      message: "",
      showAlert: false
    };
  },
  methods: {
    ...mapActions(['loginAdminUser']),
    async handleSubmit() {
      this.isLoading = true;
      this.showAlert = false;
      const formData = { email: this.email, password: this.password };

      try {
        const result = await store.dispatch('loginAdminUser', formData);

        if (result.success) {
          this.$router.push('/dashboard');
        } else {
          this.message = result.message;
          this.showAlert = true;
        }
      } finally {
        this.isLoading = false;
      }
    },
  },
  created() {
    // this runs to see if any token is stored in the local storage
    this.$store.dispatch('validateWithToken');
  }
};
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  width: 100vw;
  background-color: #f0f2f5;
}

.login-box {
  width: 100%;
  max-width: 400px;
  padding: 20px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  text-align: center;
}

.login-box h2 {
  margin-bottom: 20px;
  font-size: 24px;
  color: #333;
}

.input-group {
  margin-bottom: 15px;
  text-align: left;
}

.input-group label {
  display: block;
  font-size: 14px;
  color: #555;
  margin-bottom: 5px;
}

.input-group input {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.login-button {
  width: 100%;
  padding: 10px;
  background-color: #28a745;
  color: #fff;
  font-size: 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.login-button:hover {
  background-color: #28a745;
}

.signup-link {
  margin-top: 15px;
  font-size: 14px;
  color: #555;
}

.signup-link a {
  color: #007bff;
  text-decoration: none;
}

.signup-link a:hover {
  text-decoration: underline;
}

.error-box {
  background-color: rgba(255, 182, 193, 0.2); /* Translucent pink */
  border: 1px solid #ffb6c1; /* Solid pink border */
  color: #d81b60; /* Pink text */
  padding: 14px;
  border-radius: 8px;
  margin: 15px 0;
  font-size: 0.9rem;
  text-align: center;
  box-shadow: 0 2px 10px rgba(255, 182, 193, 0.1);
}
</style>

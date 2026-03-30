import {createStore, mapGetters} from 'vuex';
import axios from "axios";
import router from '../router/index.js';
import UserAdapter from "./UserAdapter.js";
import { formatDateToEST } from "@/utils/formatDate.js";

export default createStore({
    state: {
        user: {},
        sponsors: [],
        categories: [],
        prizes: [],
        activities: [],
        events: [],
        event: {},
        auditLogs: [],
        apiBaseUrl: import.meta.env.VITE_API_BASE_URL
    },
    mutations: {
        setUser(state, user) {
            state.user = user;
            // if the user has been set it's assumed to be safe to navigate to the dashboard
            router.push('/')
        },
        clearUser(state){
            state.user = null
        },
        setSponsors(state, sponsors){
            state.sponsors = sponsors;
        },
        setActivities(state, activities) {
            state.activities = activities;
        },
        clearActivities(state) {
            state.activities = [];
        },
        setEvents(state, events) {
            state.events = events;
        },
        clearEvents(state) {
            state.events = [];
        },
        setEvent(state, event) {
            state.event = event;
        },
        clearEvent(state) {
            state.event = null;
        },
        setCategories(state, categories) {
            state.categories = categories;
        },
        updateCategories(state, index, newCategory) {
            state.categories[index] = newCategory
        },
        setPrizes(state, prizes) {
            state.prizes = prizes;
        },
        setAuditLogs(state, auditLogs) {
            state.auditLogs = auditLogs;
        },
        clearAuditLogs(state) {
            state.auditLogs = null;
        }
    },
    actions: {
        async loginAdminUser({commit, state}, formData) {
            console.log(`URL: ${state.apiBaseUrl}`)
            try {
                const loginData = {
                    email: formData.email,
                    password: formData.password
                }

                const response = await axios.post(`${state.apiBaseUrl}/user/admin-login`, loginData, {
                    headers: {
                        "Content-Type": "application/json",
                    },
                });

                const data = response.data;
                const user = new UserAdapter(data.data)
                commit("setUser", user);

                document.cookie = `token=${user.token}; path=/;`;
                return { success: true, message: data.message }
            } catch (error) {
                return { success: false, message: error.response?.data?.message || "Login Failed" };
            }
        },
        async validateWithToken({commit, state}) {
            try {
                const token = document.cookie.split('; ').find(row => row.startsWith('token='));

                if (!token) return { success: false, message: "No token found"};

                const tokenString = token.split('=')[1];

                const response = await axios.post(`${state.apiBaseUrl}/user/auth`, {}, {
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${tokenString}`
                    },
                });

                const data = await response.data;
                const user = new UserAdapter(data.data);
                commit("setUser", user);

                return { success: true, message: data.message };
            } catch (error) {
                return { success: false, message: error.response?.data?.message || "Authentication failed" };
            }
        },
        async logout({commit}) {
            commit("clearUser");
            document.cookie = `token=; path=/;`;
            router.push("/login");
        },
        async getAllSponsors({commit, state}){
            try{
                const response = await axios.get(`${state.apiBaseUrl}/sponsor/all`);
                commit("setSponsors", response.data);
            }catch(err){
                console.error("Error fetching sponsors: ", err);
            }
        },
        async createActivity({ commit, state }, activity) {
            try {
                if (!activity || Object.keys(activity).length === 0) {
                    return { success: false, message: "Activity is empty" };
                }
                const response = await fetch(`${state.apiBaseUrl}/event/activity/`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(activity)
                });



                const data = await response.json();
                if (response.ok) {
                    return { success: true, message: data.message || "Activity created successfully" };
                } else {
                    return { success: false, message: data.message || "Failed to create activity", errors: data.errors };
                }
            } catch (error) {
                return { success: false, message: error.response?.data?.message || "Network or server error while creating activity" };
            }
        },
        async updateActivity({ commit, state }, activity) {
            try {
                if (!activity || Object.keys(activity).length === 0) {
                    return { success: false, message: "Activity is empty" };
                }
                const response = await fetch(`${state.apiBaseUrl}/event/activity`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(activity)
                });

                const data = await response.json();
                if (response.ok) {
                    return { success: true, message: data.message || "Activity updated successfully" };
                } else {
                    return { success: false, message: data.message || "Failed to update activity", errors: data.errors };
                }
            } catch (error) {
                return { success: false, message: error.response?.data?.message || "Network or server error while updating activity" };
            }
        },
        async deleteActivity({ commit, state }, id) {
            try {
                if (!id) {
                    return { success: false, message: "Something went wrong" };
                }

                const response = await fetch(`${state.apiBaseUrl}/event/activity/${id}`, {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' }
                });

                const data = await response.json();

                if (response.ok) {
                    return { success: true, message: data.message || "Activity deleted successfully" };
                } else {
                    return { success: false, message: data.message || "Failed to delete activity", errors: data.errors };
                }
            } catch (error) {
                return { success: false, message: error.message || "Network or server error while deleting activity" };
            }
        },
        async getAllActivities({ commit, state }, eventId) {
            try {
                if (!eventId) return;
                const response = await axios.get(`${state.apiBaseUrl}/event/activity/${eventId}`);

                // Convert dates from UTC to local time (i.e., EST) and to a user-friendly format
                const activities = response.data.activities.map(activity => {
                    activity.activityDate = formatDateToEST(activity.activityDate);

                    return activity;
                });

                commit("setActivities", activities);
                return {success: true, message: response.data.message};
            } catch (error) {
                return {success: false, message: error.response?.data?.message || "Error fetching activity"};
            }
        },
        async createEvent({ commit, state }, event) {
            try {
                if (!event || Object.keys(event).length === 0) {
                    return { success: false, message: "Event is empty" };
                }
                const response = await fetch(`${state.apiBaseUrl}/event/create`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(event)
                });

                const data = await response.json();
                if (response.ok) {
                    return { success: true, message: data.message || "Event created successfully" };
                } else {
                    return { success: false, message: data.message || "Failed to create event", errors: data.errors };
                }
            } catch (error) {
                return { success: false, message: error.response?.data?.message || "Network or server error while creating event" };
            }
        },
        async updateEvent({ commit, state }, event) {
            try {
                if (!event || Object.keys(event).length === 0) {
                    return { success: false, message: "Event is empty" };
                }
                const response = await fetch(`${state.apiBaseUrl}/event/update`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(event)
                });

                const data = await response.json();
                if (response.ok) {
                    return { success: true, message: data.message || "Event updated successfully" };
                } else {
                    return { success: false, message: data.message || "Failed to update event", errors: data.errors };
                }
            } catch (error) {
                return { success: false, message: error.response?.data?.message || "Network or server error while updating event" };
            }
        },
        async deleteEvent({ commit, state }, id) {
            try {
                if (!id) {
                    return { success: false, message: "Something went wrong" };
                }

                const response = await fetch(`${state.apiBaseUrl}/event/delete/${id}`, {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' }
                });

                const data = await response.json();

                if (response.ok) {
                    return { success: true, message: data.message || "Event deleted successfully" };
                } else {
                    return { success: false, message: data.message || "Failed to delete event", errors: data.errors };
                }
            } catch (error) {
                return { success: false, message: error.message || "Network or server error while deleting event" };
            }
        },
        async getAllEvents({ commit, state }) {
            try {
                const response = await axios.get(`${state.apiBaseUrl}/event/all`);

                // Convert dates from UTC to local time (i.e., EST) and to a user-friendly format
                const events = response.data.events.map(event => ({
                    ...event,
                    startDate: formatDateToEST(event.startDate),
                    endDate: formatDateToEST(event.endDate)
                }));

                commit("setEvents", events);
                return {success: true, message: response.data.message};
            } catch (error) {
                return {success: false, message: error.response?.data?.message || "Error fetching events"};
            }
        },
        async getEventById({ commit, state }, eventId) {
            try {
                if (!eventId) {
                    return { success: false, message: "Something went wrong" };
                }
                const response = await axios.get(`${state.apiBaseUrl}/event/${eventId}`);

                // Convert dates from UTC to local time (i.e., EST) and to a user-friendly format
                const event = response.data
                event.startDate = formatDateToEST(event.startDate);
                event.endDate = formatDateToEST(event.endDate)

                commit("setEvent", event);
                return {success: true, message: response.data.message};
            } catch (error) {
                return {success: false, message: error.response?.data?.message || "Error fetching event"};
            }
        },
        async getActiveEvent({ commit, state }) {
            try {
                const response = await axios.get(`${state.apiBaseUrl}/event/active`);

                // Convert dates from UTC to local time (i.e., EST) and to a user-friendly format
                const event = response.data.event
                event.startDate = formatDateToEST(event.startDate);
                event.endDate = formatDateToEST(event.endDate)

                commit("setEvent", event);
                return {success: true, message: response.data.message};
            } catch (error) {
                return {success: false, message: error.response?.data?.message || "Error fetching active event"};
            }
        },
        async getAuditLogs({ commit }, requestPayload = {}) {
            try {
                const response = await fetch(`${state.apiBaseUrl}/audit-logs/search`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(requestPayload),
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => null);
                    throw new Error(errorData?.message || "Failed to fetch audit logs");
                }

                const data = await response.json();
                commit("setAuditLogs", data.logs || []);

                return { success: true, message: data.message, pagination: data.pagination };
            } catch (error) {
                return {
                    success: false,
                    message: error.message || "Error fetching audit logs",
                };
            }
        },
        async createCategory({ commit, state }, category) {
            let response = null;

            try {
                if (!category || Object.keys(category).length === 0) {
                    return { success: false, message: "Category is empty" };
                }

                response = await axios.post(`${state.apiBaseUrl}/category/create`,
                    {
                        categoryName: category.categoryName,
                        eventId: category.eventId
                    },
                    { headers: { 'Content-Type': 'application/json' }}
                );
            } catch (error) {
                return { success: false, message: error || "Network or server error while creating category" };
            }

            const data = response.data;

            if (!response.status === 201) {
                return { success: false, message: data.message || "Failed to create category", errors: data.errors };
            }

            commit("setCategories", [...state.categories, data.category]);
            return { success: true, message: data.message || "Category created successfully" };

        },
        async updateCategory({ commit, state }, category) {
            try {
                if (!category || Object.keys(category).length === 0) {
                    return { success: false, message: "Category is empty" };
                }
                const response = await axios.post(`${state.apiBaseUrl}/category/update`,
                    category,
                    { headers: {'Content-Type': 'application/json'} }
                );

                const data = await response.json();
                if (!response.ok) {
                    return { success: false, message: data.message || "Failed to update category", errors: data.errors };
                }

                commit("updateCategories", state.categories.findIndex(category), category)

                return { success: true, message: data.message || "Category updated successfully" };

            } catch (error) {
                return { success: false, message: error.response?.data?.message || "Network or server error while updating category" };
            }
        },
        async getCategoriesForEvent({commit, state}, eventId){
            try{
                const response = await axios.get(`${state.apiBaseUrl}/category/by-event/${eventId.value}`);
                commit("setCategories", response.data.categories);

                return {
                    success: true,
                    message: response.data.message
                };
            }catch(err){
                console.error("Error fetching categories for event: ", err);
                return {
                    success: false,
                    message: err.message || "Error fetching categories for event"
                }
            }
        },
        async deleteCategory({ commit, state }, id) {

            if (!id) {
                return { success: false, message: "Missing category ID" };
            }

            try {
                const response = await axios.delete(`${state.apiBaseUrl}/category/delete/${id}`,
                    {},
                    { headers: { 'Content-Type': 'application/json' } }
                );


                const data = await response.data;
                if (!data) {
                    return { success: false, message: data.message || "Failed to delete category", errors: data.errors };
                }

                commit("setCategories",
                    state.categories.filter(
                        (category) => category.id !== id
                ));

                return { success: true, message: data.message || "Category deleted successfully" };

            } catch (error) {
                console.log("failure: " + error.message)
                return { success: false, message: error.message || "Network or server error while deleting event" };
            }
        },
        async createPrize({ commit, state }, prize) {
            let response = null;

            try {
                if (!prize || Object.keys(prize).length === 0) {
                    return { success: false, message: "Prize is empty" };
                }

                response = await axios.post(`${state.apiBaseUrl}/prize/create`,
                    {
                        eventId: prize.eventId,
                        prizeName: prize.prizeName,
                        categoryId: prize.categoryId,
                        placement: prize.placement,
                        handedOut: prize.handedOut
                    },
                    {headers: { 'Content-Type': 'application/json' }}
                );
            } catch (error) {
                return { success: false, message: error || "Network or server error while creating category" };
            }

            const data = response.data;
            if (!response.status === 201) {
                return { success: false, message: data.message || "Failed to create category", errors: data.errors };
            }

            commit("setPrizes", [...state.prizes, data.prize]);
            return { success: true, message: data.message || "Category created successfully" };
        },
        async updatePrize({ commit, state }, prize) {

            if (!prize || Object.keys(prize).length === 0) {
                return { success: false, message: "Prize is empty" };
            }

            try {
                const response = await axios.put(`${state.apiBaseUrl}/prize/update`,
                    prize,
                    { headers: {'Content-Type': 'application/json' } }
                );

                const data = await response.json();
                if (!response.ok) {
                    return { success: false, message: data.message || "Failed to update category", errors: data.errors };
                }

                commit("updatePrizes", state.prizes.findIndex(p => p.id === prize.id), prize)

                return { success: true, message: data.message || "Category updated successfully" };

            } catch (error) {
                return { success: false, message: error.message || "Network or server error while updating category" };
            }
        },
        async getPrizesForEvent({commit, state}, eventId){
            try{
                const response = await axios.get(`${state.apiBaseUrl}/prize/by-event/${eventId}`);

                const data = await response.data;
                commit("setPrizes", data.prizes);

                return {
                    success: true,
                    message: response.data.message
                };
            }catch(err){
                console.error("Error fetching categories for event: ", err);
                return {
                    success: false,
                    message: err.message || "Error fetching categories for event"
                }
            }
        },
        async deletePrize({ commit, state }, id) {

            try {
                if (!id) {
                    return { success: false, message: "Missing prize ID" };
                }

                const response = await axios.delete(`${state.apiBaseUrl}/prize/delete/${id}`,
                    {},
                    { headers: { 'Content-Type': 'application/json' } }
                );

                const data = await response.data;
                if (!data) {
                    return { success: false, message: data.message || "Failed to delete event", errors: data.errors };
                }

                commit("setPrizes",
                    state.prizes.filter(
                        p => p.id !== id
                    ));

                return { success: true, message: data.message || "Prize deleted successfully" };

            } catch (error) {
                return { success: false, message: error.message || "Network or server error while deleting prize" };
            }
        }
    },
    getters: {
        isAuthenticated: (state) => !!state.user,
        UserRole: (state) => state.user?.role || null,
        allSponsors: (state) => state.sponsors,
        getActivities: (state) => state.activities,
        getCategories: (state) => state.categories,
        getPrizes: (state) => state.prizes,
        getEvents: (state) => state.events,
        getEvent: (state) => state.event,
        getAuditLogs: (state) => state.auditLogs
    },
});

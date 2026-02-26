import { mount } from '@vue/test-utils';
import { createStore } from 'vuex';
import SideNav from '../../components/SideNav.vue';
import { RouterLinkStub } from '@vue/test-utils'
import { describe, it, expect, vi } from 'vitest';

describe('SideNav.vue', () => {
    const mockLogout = vi.fn(() => Promise.resolve());
    const mockRouterPush = vi.fn();

    const setup = (role = 'staff') => {
        //Create a mock Store
        const store = createStore({
            getters: {
                UserRole: () => role,
            },
            actions: {
                logout: mockLogout,
            },
        });

        //Create the SideNav
        return mount(SideNav, {
            global: {
                plugins: [store],
                mocks: {
                    $router: { push: mockRouterPush },
                },
                stubs: {
                    RouterLink: RouterLinkStub
                },
            },
        });
    };

    //Check that all the links are visible
    it('renders main nav links', () => {
        const wrapper = setup();

        const links = wrapper.findAllComponents(RouterLinkStub);
        const routes = links.map(link => link.props('to'));

        expect(routes).toEqual([
            '/dashboard',
            '/events',
            '/activities',
            '/applicants',
            '/teams',
            '/hardware',
            '/sponsors',
            '/prizes'
        ]);
    });

    //Audit logs should only show up for the 'oscar' role
    it('renders Audit Logs link only for oscar', () => {
        const wrapperStaff = setup('staff');
        const staffRoutes = wrapperStaff
            .findAllComponents(RouterLinkStub)
            .map(link => link.props('to'));

        expect(staffRoutes).not.toContain('/audit-logs');

        const wrapperOscar = setup('oscar');
        const oscarRoutes = wrapperOscar
            .findAllComponents(RouterLinkStub)
            .map(link => link.props('to'));

        expect(oscarRoutes).toContain('/audit-logs');
    });

    //Press the logout button and check that the router navigated to /login
    it('calls logout and navigates on Logout button click', async () => {
        const wrapper = setup();
        await wrapper.find('button.logout').trigger('click');

        expect(mockLogout).toHaveBeenCalled();
        // Wait for next tick since logout is async
        await wrapper.vm.$nextTick();
        expect(mockRouterPush).toHaveBeenCalledWith('/login');
    });
});
<template>
  <v-navigation-drawer v-bind="$attrs">
    <nuxt-link to="/" class="hidden-md-and-up">
      <v-img
        :src="require('~/static/logo-horizontal.png')"
        class="ma-3"
        contain
      />
    </nuxt-link>
    <v-divider></v-divider>
    <v-list dense color="accent">
      <v-list-item v-for="(item, i) in mainItems" :key="i" :to="item.to" router>
        <v-list-item-action>
          <v-icon>{{ item.icon }}</v-icon>
        </v-list-item-action>
        <v-list-item-content>
          <v-list-item-title v-text="item.title" />
        </v-list-item-content>
      </v-list-item>
    </v-list>
    <v-divider></v-divider>
    <v-list dense color="accent">
      <v-subheader>Submissions</v-subheader>
      <v-list-item class="mb-2">
        <v-btn
          block
          color="primary"
          class="pa-2"
          @click="openCreateSubmissionDialog()"
        >
          <v-icon left>mdi-plus</v-icon>
          Submit Record
        </v-btn>
      </v-list-item>
      <v-list-item v-for="(item, i) in navItems" :key="i" :to="item.to" router>
        <v-list-item-action>
          <v-icon>{{ item.icon }}</v-icon>
        </v-list-item-action>
        <v-list-item-content>
          <v-list-item-title v-text="item.title" />
        </v-list-item-content>
      </v-list-item>
    </v-list>
    <v-divider></v-divider>
    <v-list dense color="accent">
      <v-subheader>Stats</v-subheader>
      <v-list-item v-for="(item, i) in statItems" :key="i" :to="item.to" router>
        <v-list-item-action>
          <v-icon>{{ item.icon }}</v-icon>
        </v-list-item-action>
        <v-list-item-content>
          <v-list-item-title v-text="item.title" />
        </v-list-item-content>
      </v-list-item>
    </v-list>
    <v-divider></v-divider>
    <!--
    <v-list v-if="user" dense color="accent">
      <v-subheader>My Account</v-subheader>
      <v-list-item v-for="(item, i) in userItems" :key="i" :to="item.to" router>
        <v-list-item-action>
          <v-icon>{{ item.icon }}</v-icon>
        </v-list-item-action>
        <v-list-item-content>
          <v-list-item-title v-text="item.title" />
        </v-list-item-content>
      </v-list-item>
    </v-list>
    <v-divider></v-divider>
    -->
    <v-list v-if="isAdmin" dense color="accent">
      <v-subheader>Moderation</v-subheader>
      <v-list-item
        v-for="(item, i) in moderatorItems"
        :key="i"
        :to="item.to"
        router
        exact
      >
        <v-list-item-action>
          <v-icon>{{ item.icon }}</v-icon>
        </v-list-item-action>
        <v-list-item-content>
          <v-list-item-title v-text="item.title" />
        </v-list-item-content>
      </v-list-item>
    </v-list>

    <v-divider></v-divider>

    <AdminNavRoutes v-if="isAdmin" color="accent"></AdminNavRoutes>
  </v-navigation-drawer>
</template>

<script>
import { mapGetters } from 'vuex'
import { generateCrudRecordInterfaceRoute } from '~/services/base'
import AdminNavRoutes from '~/components/navigation/adminNavRoutes.vue'

export default {
  components: {
    AdminNavRoutes,
  },

  data() {
    return {
      mainItems: [
        {
          icon: 'mdi-home',
          title: 'Home',
          to: '/',
        },
      ],

      navItems: [
        {
          icon: 'mdi-podium',
          title: 'Leaderboard',
          to: '/leaderboard',
        },
        {
          icon: 'mdi-seal',
          title: 'Latest Submissions',
          to: '/latest-submissions',
        },
        {
          icon: 'mdi-account',
          title: 'Characters',
          to: generateCrudRecordInterfaceRoute('/public-characters', {
            search: '',
            filters: [],
            sort: {
              field: 'createdAt',
              desc: true,
            },
          }),
        },
      ],
      userItems: [
        {
          icon: 'mdi-account',
          title: 'My Profile',
          to: '/my-profile?expand=0',
        },
        {
          icon: 'mdi-view-grid-plus',
          title: 'My Apps',
          to: '/my-apps',
        },
        {
          icon: 'mdi-file',
          title: 'My Files',
          to: '/my-files',
        },
      ],

      statItems: [
        {
          icon: 'mdi-chart-line',
          title: 'Record Progression',
          to: '/record-progression',
        },
      ],

      moderatorItems: [
        {
          icon: 'mdi-format-list-checkbox',
          title: 'Review Queue',
          to: generateCrudRecordInterfaceRoute('/submissions', {
            search: '',
            filters: [
              {
                field: 'status',
                operator: 'in',
                value: ['UNDER_REVIEW', 'SUBMITTED', 'INFORMATION_REQUESTED'],
              },
            ],
            sort: {
              field: 'createdAt',
              desc: true,
            },
          }),
        },
        {
          icon: 'mdi-checkbox-marked',
          title: 'Done',
          to: generateCrudRecordInterfaceRoute('/submissions', {
            search: '',
            filters: [
              {
                field: 'status',
                operator: 'in',
                value: ['APPROVED', 'REJECTED'],
              },
            ],
            sort: {
              field: 'updatedAt',
              desc: true,
            },
          }),
        },
        {
          icon: 'mdi-swap-horizontal',
          title: 'Remap Character',
          to: '/remap-character',
        },
        {
          icon: 'mdi-account',
          title: 'Manage Characters',
          to: generateCrudRecordInterfaceRoute('/manage-characters', {
            search: '',
            filters: [],
            sort: {
              field: 'createdAt',
              desc: true,
            },
          }),
        },
      ],
    }
  },
  computed: {
    ...mapGetters({
      user: 'auth/user',
    }),

    isAdmin() {
      return this.$store.getters['auth/user']?.role === 'ADMIN'
    },
  },
  methods: {
    openCreateSubmissionDialog() {
      try {
        this.$root.$emit('openEditRecordDialog', {
          recordInfo: 'MySubmission',
          mode: 'add',
          selectedItem: {},
        })
      } catch (err) {
        handleError(this, err)
      }
    },
  },
}
</script>

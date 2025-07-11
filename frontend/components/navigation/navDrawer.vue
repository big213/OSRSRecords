<template>
  <v-navigation-drawer v-bind="$attrs">
    <nuxt-link to="/" class="hidden-md-and-up">
      <v-img :src="logoImageSrc" class="ma-3" contain />
    </nuxt-link>
    <v-divider></v-divider>
    <v-list dense>
      <v-list-item
        v-for="(item, i) in mainItems"
        :key="i"
        :to="item.to"
        nuxt
        router
        exact-path
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
    <v-list dense>
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
      <v-list-item
        v-for="(item, i) in navItems"
        :key="i"
        :to="item.to"
        nuxt
        router
        exact-path
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
    <v-list dense>
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
    <v-list v-if="user" dense>
      <v-subheader>My Account</v-subheader>
      <v-list-item
        v-for="(item, i) in userItems"
        :key="i"
        :to="item.to"
        nuxt
        router
        exact-path
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
    -->
    <v-list v-if="isModerator" dense>
      <v-subheader>Moderation</v-subheader>
      <v-list-item
        v-for="(item, i) in moderatorItems"
        :key="i"
        :to="item.to"
        nuxt
        router
        exact-path
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
    <AdminNavRoutes v-if="isAdmin"></AdminNavRoutes>
  </v-navigation-drawer>
</template>

<script>
import { mapGetters } from 'vuex'
import { generateCrudRecordRoute } from '~/services/base'
import AdminNavRoutes from '~/components/navigation/adminNavRoutes.vue'
import { logoHasLightVariant } from '~/services/config'
import * as myModels from '~/models/my'
import * as publicModels from '~/models/public'

function generateUserRouteObject(
  that,
  recordInfo,
  customPath,
  customPageOptions
) {
  return {
    icon: recordInfo.icon,
    title: recordInfo.title ?? recordInfo.pluralName,
    to: generateCrudRecordRoute(that, {
      path: customPath,
      typename: recordInfo.typename,
      routeType: 'my',
      pageOptions:
        customPageOptions === null
          ? null
          : {
              search: '',
              filters: [],
              sort: {
                field: 'createdAt',
                desc: true,
              },
              ...customPageOptions,
            },
    }),
  }
}

function generatePublicRouteObject(
  that,
  recordInfo,
  customPath,
  customPageOptions
) {
  return {
    icon: recordInfo.icon,
    title: recordInfo.title ?? recordInfo.pluralName,
    to: generateCrudRecordRoute(that, {
      path: customPath,
      typename: recordInfo.typename,
      routeType: 'i',
      pageOptions:
        customPageOptions === null
          ? null
          : {
              search: '',
              filters: [],
              sort: {
                field: 'createdAt',
                desc: true,
              },
              ...customPageOptions,
            },
    }),
  }
}

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
        generatePublicRouteObject(this, publicModels.PublicCharacter),
      ],

      userItems: [
        generateUserRouteObject(this, myModels.MyApiKey),
        generateUserRouteObject(this, myModels.MyFile),
        {
          icon: 'mdi-account',
          title: 'My Profile',
          to: '/my-profile',
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
          to: '/review-queue',
        },
        {
          icon: 'mdi-checkbox-marked',
          title: 'Done',
          to: generateCrudRecordRoute(this, {
            typename: 'submission',
            routeType: 'a',
            pageOptions: {
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
          to: generateCrudRecordRoute(this, {
            typename: 'character',
            routeType: 'a',
            pageOptions: {
              search: '',
              filters: [],
              sort: {
                field: 'createdAt',
                desc: true,
              },
            },
          }),
        },
        /*
        {
          icon: 'mdi-star-box',
          title: 'Manage Events',
          to: generateCrudRecordRoute(this, {
            typename: 'event',
            routeType: 'a',
            pageOptions: {
              search: '',
              filters: [],
              sort: {
                field: 'createdAt',
                desc: true,
              },
            },
          }),
        },
        */
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

    isModerator() {
      return ['ADMIN', 'MODERATOR'].includes(
        this.$store.getters['auth/user']?.role
      )
    },

    logoImageSrc() {
      return logoHasLightVariant
        ? require(`~/static/logo-horizontal${
            this.$vuetify.theme.dark ? '' : '-light'
          }.png`)
        : require('~/static/logo-horizontal.png')
    },
  },

  methods: {
    openCreateSubmissionDialog() {
      try {
        this.$root.$emit('openEditRecordDialog', {
          recordInfo: 'UserSubmission',
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

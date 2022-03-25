<template>
  <v-layout column justify-center align-center>
    <v-container xs12 style="max-width: 600px">
      <div class="text-center">
        <img :src="logoImageSrc" alt="" style="width: 60%" />
      </div>
      <v-card>
        <v-card-title class="headline">
          Welcome to {{ siteName }}
        </v-card-title>
        <v-card-text>
          <p v-if="siteDescription">
            <span>{{ siteDescription }}.</span>
          </p>
          <p v-if="siteDiscordLink">
            Check out our official
            <a :href="siteDiscordLink" target="_blank">Discord server</a>.
          </p>
          <p v-if="siteContactEmail">
            To get in touch with us, please send us an email at
            <a>{{ siteContactEmail }}</a
            >.
          </p>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" @click="openCreateSubmissionDialog()">
            <v-icon left> mdi-plus </v-icon>
            Submit Record</v-btn
          >
          <v-btn color="primary" nuxt to="/leaderboard">
            <v-icon left> mdi-podium </v-icon>
            Leaderboard</v-btn
          >
        </v-card-actions>
      </v-card>
      <ReleaseHistory class="mt-3" />
    </v-container>
  </v-layout>
</template>

<script>
import { mapGetters } from 'vuex'
import ReleaseHistory from '~/components/common/releaseHistory.vue'
import {
  siteName,
  siteDescription,
  siteContactEmail,
  siteDiscordLink,
  logoHasLightVariant,
} from '~/services/config'
// import { getEvents } from '~/services/dropdown'

export default {
  components: {
    ReleaseHistory,
  },
  data() {
    return {
      siteName,
      siteDescription,
      siteContactEmail,
      siteDiscordLink,
    }
  },

  mounted() {
    // set a random image
    /*
    getEvents(this).then((events) => {
      const eventsWithBgImages = events.filter((event) => event.backgroundImage)

      if (eventsWithBgImages.length < 1) return

      this.$root.$emit('setBackgroundImage', {
        url: eventsWithBgImages[
          Math.floor(Math.random() * (eventsWithBgImages.length - 1))
        ].backgroundImage,
      })
    })
    */
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

  head() {
    return {
      title: 'Home',
    }
  },
  computed: {
    ...mapGetters({
      user: 'auth/user',
    }),

    logoImageSrc() {
      return logoHasLightVariant
        ? require(`~/static/logo-vertical${
            this.$vuetify.theme.dark ? '' : '-light'
          }.png`)
        : require('~/static/logo-vertical.png')
    },
  },
}
</script>

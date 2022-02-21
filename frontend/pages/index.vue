<template>
  <v-layout column justify-center align-center>
    <v-container xs12 style="max-width: 600px">
      <div class="text-center">
        <img src="~/static/logo-vertical.png" alt="" style="width: 60%" />
      </div>
      <v-card>
        <v-card-title class="headline">
          Welcome to {{ siteName }}
        </v-card-title>
        <v-card-text>
          <p>
            <span>{{ siteDescription }}</span>
            <span v-if="siteDiscordLink"
              >Check out our official
              <a :href="siteDiscordLink" target="_blank">Discord server</a>.
            </span>
            <span v-if="siteContactEmail"
              >If you would prefer to email, our email is
              <a>{{ siteContactEmail }}</a
              >.</span
            >
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
  },
}
</script>

export const siteName = process.env.siteName
export const siteDescription = process.env.siteDescription
export const siteImageUrl = process.env.siteImageUrl
export const siteContactEmail = process.env.siteContactEmail
export const siteDiscordLink = process.env.siteDiscordLink
export const siteGithubRepositoryUrl = process.env.siteGithubRepositoryUrl
export const logoHasLightVariant = process.env.logoHasLightVariant
export const defaultGridView = process.env.defaultGridView

export const firebaseConfig = {
  apiKey: 'AIzaSyBoq4mq_Tn-Pi6Vof331A1Pp8ekO9lLK6Y',
  authDomain: 'osrs-records.firebaseapp.com',
  projectId: 'osrs-records',
  storageBucket: 'osrs-records.appspot.com',
  messagingSenderId: '994158406550',
  appId: '1:994158406550:web:d1a3e18c21e48c201c8bb7',
}

export const routesMap = {
  a: [
    'apiKey',
    'file',
    'user',
    'userUserFollowLink',
    'eventEra',
    'eventClass',
    'eventGroup',
    'event',
    'submission',
    'character',
    'discordChannel',
    'discordChannelOutput',
  ],
  i: ['user', 'character', 'submission'],
  my: ['apiKey', 'file'],
  s: ['userSubmission'],
}

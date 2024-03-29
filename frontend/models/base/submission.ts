import type { RecordInfo } from '~/types'
import TimeagoColumn from '~/components/table/timeagoColumn.vue'
import DateStringColumn from '~/components/table/dateStringColumn.vue'
import PreviewableFilesColumn from '~/components/table/previewableFilesColumn.vue'
import BooleanColumn from '~/components/table/booleanColumn.vue'
import SubmissionStatusColumn from '~/components/table/special/submissionStatusColumn.vue'
import SubmissionStatusReadonlyColumn from '~/components/table/special/submissionStatusReadonlyColumn.vue'
import ResultColumn from '~/components/table/special/resultColumn.vue'
import SubmissionTypeColumn from '~/components/table/special/submissionTypeColumn.vue'
import AdminEditSubmissionInterface from '~/components/interface/crud/special/adminEditSubmissionInterface.vue'
import CrudSubmissionInterface from '~/components/interface/crud/special/crudSubmissionInterface.vue'
import UrlColumn from '~/components/table/urlColumn.vue'
import EvidenceColumn from '~/components/table/special/evidenceColumn.vue'
import AllEvidenceColumn from '~/components/table/special/allEvidenceColumn.vue'
import RankingColumn from '~/components/table/special/rankingColumn.vue'
import ReignColumn from '~/components/table/special/reignColumn.vue'
import ParticipantsColumn from '~/components/table/special/participantsColumn.vue'
import ParticipantsPreviewColumn from '~/components/table/special/participantsPreviewColumn.vue'
import { getEventsByGroup, getSubmissionStatuses } from '~/services/dropdown'
import { isValidEvidenceLink, serializeTime } from '~/services/common'
import {
  generateJoinableField,
  generatePreviewableRecordField,
} from '~/services/recordInfo'

export const Submission = <RecordInfo<'submission'>>{
  typename: 'submission',
  pluralTypename: 'submissions',
  name: 'Submission',
  pluralName: 'Submissions',
  icon: 'mdi-timer',
  // renderItem: (item) => item.name,
  fields: {
    id: {
      text: 'ID',
    },
    event: {
      ...generateJoinableField({
        fieldname: 'event',
        typename: 'event',
        text: 'Event Category',
        hasAvatar: true,
        inputType: 'autocomplete',
      }),
      getOptions: getEventsByGroup,
    },
    eventRecord: generatePreviewableRecordField({
      fieldname: 'event',
      text: 'Event Category',
    }),
    eventRecordWithParticipants: {
      text: 'Event Category',
      fields: [
        'event.name',
        'event.avatar',
        'event.id',
        'event.maxParticipants',
        'event.__typename',
        'participants',
      ],
      component: SubmissionTypeColumn,
      compoundOptions: {
        // primaryField: 'event.name',
      },
    },
    eventEra: generateJoinableField({
      fieldname: 'eventEra',
      typename: 'eventEra',
      text: 'Event Era',
      hasAvatar: true,
    }),
    'eventEra.isRelevant': {
      text: 'Is From Relevant Event Era',
    },
    'submissionCharacterParticipantLink/character': {
      text: 'Character Name',
      fields: ['submissionCharacterParticipantLink/character.id'],
      inputType: 'server-autocomplete',
      inputOptions: {
        hasAvatar: true,
        typename: 'character',
      },
    },
    eventEraRecord: generatePreviewableRecordField({
      fieldname: 'eventEra',
      text: 'Event Era',
    }),
    participants: {
      text: 'Participants Count',
    },
    participantsList: {
      text: 'Team Members',
      fields: [
        'participantsList',
        'participantsList.discordId',
        'participantsList.characterId',
      ],
      hint: 'The person submitting the record should put their RSN/Discord ID as the first entry. One RSN per row only.',
      inputType: 'value-array',
      inputOptions: {
        nestedFields: [
          {
            key: 'characterId',
            inputType: 'server-combobox',
            text: 'RSN/Alias',
            inputOptions: {
              typename: 'character',
              cols: 6,
            },
          },
          {
            key: 'discordId',
            inputType: 'text',
            text: 'Discord ID',
            optional: true,
            inputOptions: {
              cols: 6,
            },
          },
        ],
      },
      default: () => [null],
    },
    participantsLinksList: {
      text: 'Team Members',
      fields: [
        'participantsLinksList.character.id',
        'participantsLinksList.character.name',
        'participantsLinksList.character.avatar',
        'participantsLinksList.character.__typename',
      ],
      pathPrefix: 'participantsLinksList',
      component: ParticipantsPreviewColumn,
    },
    participantsLinksListDetail: {
      text: 'Team Members',
      fields: [
        'participantsLinksList.id',
        'participantsLinksList.title',
        'participantsLinksList.character.id',
        'participantsLinksList.character.name',
        'participantsLinksList.character.avatar',
        'participantsLinksList.character.__typename',
      ],
      pathPrefix: 'participantsLinksList',
      component: ParticipantsColumn,
    },
    externalLinks: {
      text: 'Evidence Links',
      hint: 'Image or video links backing up the submission. At least 1 image + 1 gif/video required. If you have any links that you would prefer NOT to be shown publicly, please include them in the "Private Comments" section below.',
      inputType: 'value-array',
      inputOptions: {
        nestedFields: [
          {
            key: 'main',
            inputType: 'text',
            text: 'Link URL',
            hint: 'Only Imgur/Streamable/YT links currently supported',
          },
        ],
      },
      default: () => [null, null],
      parseValue: (val) => {
        if (!Array.isArray(val)) throw new Error('Array expected')

        // filter out empty links
        const nonEmptyLinks = val.map((ele) => ele.main).filter((ele) => ele)

        // throw err if not imgur/streamable/yt
        if (nonEmptyLinks.some((link) => !isValidEvidenceLink(link))) {
          throw new Error(
            'Only Imgur/Streamable/YouTube Links currently supported'
          )
        }

        return nonEmptyLinks
      },
      serialize: (val) => {
        if (!Array.isArray(val)) return []

        return val.map((ele) => ({ main: ele }))
      },
      component: UrlColumn,
    },
    mainEvidenceLinks: {
      text: 'Evidence',
      fields: ['firstImageLink', 'firstVideoLink'],
      component: EvidenceColumn,
    },
    allEvidenceLinks: {
      text: 'Evidence',
      fields: ['externalLinks'],
      component: AllEvidenceColumn,
    },
    score: {
      text: 'Result',
      component: ResultColumn,
    },
    timeElapsed: {
      text: 'Time',
      hint: 'Type in the numbers only, the numbers will be auto-formatted. Must be a multiple of 0.6 (1 game tick).',
      inputRules: [
        (value) => {
          const regEx = /^(\d+:)?([0-5]?\d:)?[0-5]?\d\.\d{1}$/
          return (
            !value ||
            regEx.test(value) ||
            'Invalid Time Format, must be like 12:34:56.7'
          )
        },
      ],
      serialize: serializeTime,
      parseValue: (value) => {
        if (!value) throw new Error('Time field is required')
        if (typeof value !== 'string') throw new Error('Invalid value')
        const regEx = /^(\d+:)?([0-5]?\d:)?[0-5]?\d\.\d{1}$/
        if (!regEx.test(value)) throw new Error('Invalid value')

        // convert string to number of ms.
        const parts = value.split('.')

        let ms = 0

        ms += Number(parts[parts.length - 1]) * 100

        const firstParts = parts[0].split(':')

        if (firstParts.length > 1) {
          ms += (Number(firstParts[0]) * 60 + Number(firstParts[1])) * 1000
        } else {
          ms += Number(firstParts[0]) * 1000
        }
        // round to tens
        const roundedMs = 10 * Math.floor(ms / 10)

        // confirm if the time is a multiple of 600
        if (roundedMs % 600 !== 0)
          throw new Error('Time field must be a multiple of 0.6 (1 game tick)')

        return roundedMs
      },
    },
    happenedOn: {
      text: 'Happened On',
      inputType: 'datetimepicker',
      optional: true,
      hint: 'If you used at least one imgur link in the evidence links, you can leave this blank',
      component: TimeagoColumn,
    },
    previousRecordHappenedOn: {
      text: 'Previous Record Date',
      fields: ['previousRecord.happenedOn'],
      pathPrefix: 'previousRecord.happenedOn',
      component: DateStringColumn,
    },
    supersedingRecordHappenedOn: {
      text: 'Superseding Record Date',
      fields: ['supersedingRecord.happenedOn'],
      pathPrefix: 'supersedingRecord.happenedOn',
      component: DateStringColumn,
    },
    daysRecordStood: {
      text: 'Reign',
      fields: [
        'supersedingRecord.happenedOn',
        'happenedOn',
        'isRelevantRecord',
      ],
      component: ReignColumn,
    },
    status: {
      text: 'Status',
      getOptions: getSubmissionStatuses,
      inputType: 'select',
      component: SubmissionStatusColumn,
      default: () => 'APPROVED',
    },
    statusReadonly: {
      text: 'Status',
      fields: ['status'],
      component: SubmissionStatusReadonlyColumn,
    },
    isRecordingVerified: {
      text: 'Recording Verified',
      inputType: 'switch',
      component: BooleanColumn,
      default: () => false,
    },
    discordId: {
      text: 'Discord ID',
      hint: 'We will use this to contact you if there are any issues with the submission',
    },
    isCurrent: {
      text: 'Is Current',
      inputType: 'switch',
      component: BooleanColumn,
    },
    isSoloPersonalBest: {
      text: 'Is Solo PB',
      component: BooleanColumn,
    },
    isRelevantRecord: {
      text: 'Is Relevant Record',
      component: BooleanColumn,
    },
    world: {
      text: 'World',
      optional: true,
      hint: 'The game world this submission took place on, if known',
    },
    files: {
      text: 'Files',
      inputType: 'multiple-file',
      default: () => [],
      /*       parseValue: (val) =>
        Array.isArray(val) ? val.map((ele) => ele.id) : null, */
      component: PreviewableFilesColumn,
    },
    privateComments: {
      text: 'Private Comments',
      hint: 'Comments only for submission reviewers to see',
      inputType: 'textarea',
    },
    publicComments: {
      text: 'Public Comments',
      hint: 'Comments for everyone to see',
      inputType: 'textarea',
    },
    reviewerComments: {
      text: 'Reviewer Comments',
      hint: 'Comments by the reviewer',
      inputType: 'textarea',
    },
    eraRanking: {
      text: 'Era Ranking',
      component: RankingColumn,
    },
    relevantEraRanking: {
      text: 'Relevant Era Ranking',
      fields: ['ranking'],
      component: RankingColumn,
      args: {
        getArgs: (that) => {
          return {
            isRelevantEventEra: true,
            excludeEventEra: true,
          }
        },
        path: 'ranking',
      },
    },
    submittedBy: {
      text: 'Submitted By',
      hint: 'RSN',
    },
    createdAt: {
      text: 'Created At',
      component: TimeagoColumn,
    },
    updatedAt: {
      text: 'Updated At',
      component: TimeagoColumn,
    },
  },
  paginationOptions: {
    hasSearch: false,
    handleRowClick: (that, props) => {
      that.openEditDialog('view', props.item)
    },
    filterOptions: [
      {
        field: 'status',
        operator: 'in',
        inputType: 'multiple-select',
      },
      {
        field: 'eventEra',
        operator: 'eq',
        inputType: 'select',
      },
      {
        field: 'eventEra.isRelevant',
        operator: 'eq',
        inputType: 'switch',
      },
      {
        field: 'event',
        operator: 'eq',
        inputType: 'select',
      },
      {
        field: 'participants',
        operator: 'eq',
        inputType: 'text',
      },
      {
        field: 'isSoloPersonalBest',
        operator: 'eq',
        inputType: 'switch',
      },
      {
        field: 'submissionCharacterParticipantLink/character',
        operator: 'eq',
        inputType: 'server-autocomplete',
      },
    ],
    sortOptions: [
      {
        field: 'createdAt',
        desc: true,
      },
      {
        field: 'updatedAt',
        desc: true,
      },
      {
        field: 'happenedOn',
        desc: true,
      },
      {
        field: 'score',
        desc: true,
      },
      {
        field: 'score',
        desc: false,
      },
    ],
    additionalSortParams: [
      {
        field: 'happenedOn',
        desc: false,
      },
    ],
    headerOptions: [
      {
        field: 'eventRecordWithParticipants',
      },
      {
        field: 'eventEraRecord',
        width: '150px',
      },
      {
        field: 'status',
        width: '150px',
      },
      {
        field: 'score',
        width: '100px',
        align: 'right',
      },
      {
        field: 'createdAt',
        width: '150px',
      },
      {
        field: 'updatedAt',
        width: '150px',
      },
    ],
    downloadOptions: {},
    interfaceComponent: CrudSubmissionInterface,
  },
  addOptions: {
    fields: [
      'event',
      'eventEra',
      'timeElapsed',
      'externalLinks',
      'happenedOn',
      'participantsList',
      'world',
      // 'files',
      'privateComments',
      'publicComments',
      'status',
      'isRecordingVerified',
    ],

    component: AdminEditSubmissionInterface,
  },
  // importOptions: { fields: ['avatar', 'name', 'description', 'isPublic'] },
  editOptions: {
    fields: [
      'event',
      'eventEra',
      'timeElapsed',
      'world',
      // 'files',
      'externalLinks',
      'happenedOn',
      'participantsList',
      'privateComments',
      'publicComments',
      'reviewerComments',
      'isRecordingVerified',
      'status',
      'discordId',
    ],
    component: AdminEditSubmissionInterface,
  },
  viewOptions: {
    fields: [
      'eventRecordWithParticipants',
      'eventEraRecord',
      'participantsLinksListDetail',
      'score',
      'happenedOn',
      'status',
      'isRecordingVerified',
      'world',
      'relevantEraRanking',
      'daysRecordStood',
      // 'supersedingRecordHappenedOn',
      // 'previousRecordHappenedOn',
      // 'files',
      'externalLinks',
      'privateComments',
      'publicComments',
      'reviewerComments',
      'discordId',
      'isSoloPersonalBest',
      'isRelevantRecord',
    ],
  },
  enterOptions: {
    routeType: 'a',
  },
  deleteOptions: {},
  shareOptions: {},
  expandTypes: [],
}

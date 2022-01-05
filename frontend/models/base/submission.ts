import type { RecordInfo } from '~/types'
import TimeagoColumn from '~/components/table/common/timeagoColumn.vue'
import TimeStringColumn from '~/components/table/common/timeStringColumn.vue'
import PreviewableFilesColumn from '~/components/table/common/previewableFilesColumn.vue'
import BooleanColumn from '~/components/table/common/booleanColumn.vue'
import RecordColumn from '~/components/table/common/recordColumn.vue'
import SubmissionStatusColumn from '~/components/table/common/submissionStatusColumn.vue'
import ResultColumn from '~/components/table/common/resultColumn.vue'
import SubmissionTypeColumn from '~/components/table/common/submissionTypeColumn.vue'
import AdminEditSubmissionInterface from '~/components/interface/crud/special/adminEditSubmissionInterface.vue'
import CrudSubmissionInterface from '~/components/interface/crud/special/crudSubmissionInterface.vue'
import { generateParseDateTimeStringFn } from '~/services/base'
import UrlColumn from '~/components/table/common/urlColumn.vue'
import RankingColumn from '~/components/table/common/rankingColumn.vue'
import ParticipantsColumn from '~/components/table/common/participantsColumn.vue'
import ParticipantsPreviewColumn from '~/components/table/common/participantsPreviewColumn.vue'
import { getEventsByGroup, getSubmissionStatuses } from '~/services/dropdown'
import { serializeTime } from '~/services/common'

export const Submission = <RecordInfo<'submission'>>{
  typename: 'submission',
  pluralTypename: 'submissions',
  name: 'Submission',
  pluralName: 'Submissions',
  icon: 'mdi-timer',
  routeName: 'a-view',
  // renderItem: (item) => item.name,
  fields: {
    id: {
      text: 'ID',
    },
    event: {
      text: 'Event Category',
      fields: ['event.id'],
      inputType: 'autocomplete',
      inputOptions: {
        hasAvatar: true,
        typename: 'event',
      },
      getOptions: getEventsByGroup,
    },
    eventRecord: {
      text: 'Event Category',
      fields: ['event.name', 'event.avatar', 'event.id', 'event.__typename'],
      pathPrefix: 'event',
      component: RecordColumn,
    },
    eventRecordWithParticipants: {
      text: 'Event Category',
      fields: [
        'event.name',
        'event.avatar',
        'event.id',
        'event.__typename',
        'participants',
      ],
      component: SubmissionTypeColumn,
      compoundOptions: {
        // primaryField: 'event.name',
      },
    },
    eventEra: {
      text: 'Event Era',
      fields: ['eventEra.id'],
      inputType: 'server-autocomplete',
      inputOptions: {
        hasAvatar: true,
        typename: 'eventEra',
      },
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
    eventEraRecord: {
      text: 'Event Era',
      fields: [
        'eventEra.name',
        'eventEra.avatar',
        'eventEra.id',
        'eventEra.__typename',
      ],
      pathPrefix: 'eventEra',
      component: RecordColumn,
    },
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
      inputType: 'value-array',
      inputOptions: {
        nestedFields: [
          {
            key: 'discordId',
            inputType: 'text',
            text: 'Discord ID',
            inputOptions: {
              cols: 6,
            },
          },
          {
            key: 'characterId',
            inputType: 'server-combobox',
            text: 'Character ID',
            inputOptions: {
              typename: 'character',
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
      text: 'External Links',
      inputType: 'value-array',
      inputOptions: {
        nestedFields: [
          {
            key: 'main',
            inputType: 'text',
            text: 'Link URL',
          },
        ],
      },
      default: () => [null],
      parseValue: (val) => {
        if (!Array.isArray(val)) throw new Error('Array expected')

        return val.map((ele) => ele.main)
      },
      serialize: (val) => {
        if (!Array.isArray(val)) return []

        return val.map((ele) => ({ main: ele }))
      },
      component: UrlColumn,
    },
    mainExternalLink: {
      text: 'Evidence Link',
      component: UrlColumn,
    },
    score: {
      text: 'Result',
      component: ResultColumn,
    },
    timeElapsed: {
      text: 'Time',
      hint: 'Type in the numbers only, the numbers will be auto-formatted',
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
        if (!value) return null
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
        return 10 * Math.floor(ms / 10)
      },
    },
    happenedOn: {
      text: 'Happened On',
      inputType: 'datepicker',
      hint: 'To specify the exact date and time, use format: YYYY-MM-DD 1:23 PM',
      // YYYY-MM-DD to unix timestamp
      parseValue: generateParseDateTimeStringFn('startOfDay'),
      component: TimeStringColumn,
    },
    previousRecordHappenedOn: {
      text: 'Previous Record Time',
      fields: ['previousRecord.happenedOn'],
      pathPrefix: 'previousRecord.happenedOn',
      component: TimeStringColumn,
    },
    status: {
      text: 'Status',
      getOptions: getSubmissionStatuses,
      inputType: 'select',
      component: SubmissionStatusColumn,
      default: () => 'APPROVED',
    },
    isCurrent: {
      text: 'Is Current',
      inputType: 'switch',
      component: BooleanColumn,
    },
    world: {
      text: 'World',
      optional: true,
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
      inputType: 'textarea',
    },
    publicComments: {
      text: 'Public Comments',
      inputType: 'textarea',
    },
    ranking: {
      text: 'Era Ranking',
      component: RankingColumn,
    },
    submittedBy: {
      text: 'Submitted By',
      hint: 'RSN',
    },
    discordId: {
      text: 'Discord ID',
      optional: true,
    },
    createdBy: {
      text: 'Created By',
      fields: ['createdBy.id'],
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
    handleRowClick: (that, item) => {
      that.openEditDialog('view', item)
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
    headerOptions: [
      {
        field: 'eventRecordWithParticipants',
        sortable: false,
      },
      {
        field: 'eventEraRecord',
        width: '150px',
        sortable: false,
      },
      {
        field: 'status',
        width: '150px',
        sortable: false,
      },
      {
        field: 'score',
        width: '100px',
        sortable: true,
        align: 'right',
      },
      {
        field: 'createdAt',
        width: '150px',
        sortable: true,
      },
      {
        field: 'updatedAt',
        width: '150px',
        sortable: true,
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
      'happenedOn',
      'externalLinks',
      'participantsList',
      'world',
      // 'files',
      'privateComments',
      'publicComments',
      'status',
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
      'privateComments',
      'publicComments',
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
      'world',
      'ranking',
      'previousRecordHappenedOn',
      // 'files',
      'externalLinks',
      'privateComments',
      'publicComments',
    ],
  },
  enterOptions: {},
  deleteOptions: {},
  shareOptions: {},
  expandTypes: [],
}

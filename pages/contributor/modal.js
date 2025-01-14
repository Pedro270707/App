/* global axios, Vue */

export default {
  name: 'contributor-modal',
  template: `
  <v-dialog
      v-model="dialog"
      max-width="600"
    >
      <v-card>
        <v-card-title class="headline" v-text="dialogTitle"></v-card-title>
        <v-card-text>
          <v-row>
            <v-col v-if="formData.uuid" class="col-2" :sm="$vuetify.breakpoint.mdAndUp ? 3 : 2">
              <img alt="avatar" style="width: 100%; max-width: 250" :src="($vuetify.breakpoint.mdAndUp ? 'https://visage.surgeplay.com/full/256/' : 'https://visage.surgeplay.com/head/128/') + formData.uuid" />
            </v-col><v-col :class="'col-' + formData.uuid ? '10' : '12'" :sm="formData.uuid ? ($vuetify.breakpoint.mdAndUp ? 9 : 10) : 12">
              <v-form ref="form" lazy-validation>
                <v-text-field required :readonly="add == false" v-model="formData.id" :label="$root.lang().database.labels.discord_id"></v-text-field>
                <v-text-field required clearable v-model="formData.username" :label="$root.lang().database.labels.username"></v-text-field>
                <v-select required multiple small-chips v-model="formData.type" :items="types" :label="$root.lang().database.labels.contributor_type"></v-select>
                <v-text-field required clearable v-model="formData.uuid" :label="$root.lang().database.labels.uuid"></v-text-field>
              </v-form>
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="red darken-1"
            text
            @click="disableDialog"
          >
            {{ $root.lang().global.btn.cancel }}
          </v-btn>
          <v-btn
            color="darken-1"
            text
            @click="send"
          >
            {{ $root.lang().global.btn.save }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  `,
  props: {
    dialog: {
      type: Boolean,
      required: true
    },
    disableDialog: {
      type: Function,
      required: true
    },
    add: {
      type: Boolean,
      required: false,
      default: false
    },
    data: {
      type: Object,
      required: true
    },
    types: {
      type: Array,
      required: false,
      default: function () { return ['Member'] }
    }
  },
  data() {
    return {
      formData: {
        username: '',
        type: undefined,
        uuid: '',
        id: ''
      }
    }
  },
  computed: {
    dialogTitle: function () {
      return this.add ? this.$root.lang().database.titles.add_contributor : this.$root.lang().database.titles.change_contributor
    }
  },
  methods: {
    send: function () {
      const data = JSON.parse(JSON.stringify(this.formData))
      data.token = this.$root.user.access_token

      axios.post(this.add ? '/contributors/add' : '/contributors/change', data)
        .then(() => {
          this.$root.showSnackBar(this.$root.lang().global.ends_success, 'success')
          this.disableDialog(true)
        })
        .catch(error => {
          console.error(error)
          this.$root.showSnackBar(`${error.message}: ${error.response.data.error}`, 'error')
        })
    }
  },
  watch: {
    dialog: function (newValue, oldValue) {
      if (oldValue !== newValue && newValue === true) {
        Vue.nextTick(() => {
          this.$refs.form.reset()

          if (!this.add) {
            const keys = Object.keys(this.data)
            keys.forEach(key => {
              this.formData[key] = this.data[key]
            })
          }
        })
      }
    }
  }
}

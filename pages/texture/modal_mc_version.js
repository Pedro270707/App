/* global axios */

export default {
  name: 'version-modal',
  template: `
  <v-dialog
    v-model="MCDialog"
    max-width="600"
  >

  <v-card>
    <v-card-title class="headline">{{ $root.lang().database.titles.change_mc_version }}</v-card-title>
    <v-card-text>
      <v-row>
        <v-col class="col-12" sm="12">
          <p align="justify">
            {{ $root.lang().database.hints.example_scenario }}
            <br><br>
            <strong style="color: red">{{ $root.lang().database.hints.example_scenario_warn }}</strong>
          </p>
        </v-col>
      </v-row>
      <v-row>
        <v-col class="col-12" sm="12">
          <v-form ref="form">
            <v-text-field required v-model="form.actual" :label="$root.lang().database.labels.actual_mc_version"></v-text-field>
            <v-text-field required v-model="form.new" :label="$root.lang().database.labels.new_mc_version"></v-text-field>
          </v-form>
        </v-col>
      </v-row>
    </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn
          color="darken-1"
          text
          @click="disableMCDialog"
        >
          {{ $root.lang().global.btn.cancel }}
        </v-btn>
        <v-btn
          color="error darken-1"
          @click="send"
        >
          {{ $root.lang().global.btn.save }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>`,
  props: {
    MCDialog: {
      type: Boolean,
      required: true
    },
    disableMCDialog: {
      type: Function,
      required: true
    }
  },
  data() {
    return {
      form: {
        actual: settings.versions.java[0],
        new: settings.versions.java[0]
      }
    }
  },
  methods: {
    send: function () {
      const data = JSON.parse(JSON.stringify(this.form))
      data.token = this.$root.user.access_token

      axios.post('/paths/version-update/', data)
        .then(() => {
          this.$root.showSnackBar(this.$root.lang().global.ends_success, 'success')
          this.disableMCDialog(true)
        })
        .catch(err => {
          console.error(err)
          this.$root.showSnackBar(`${err.message}: ${err.response.data.error}`, 'error')
        })
    }
  }
}

<template>
  <v-card class="mb-4" outlined elevation="2">
    <!-- ライブ名（イベント名） -->
    <v-card-title class="primary white--text text-h5 font-weight-bold py-3">
      {{ event.eventName }}
    </v-card-title>

    <v-card-text class="pa-3">
      <!-- アコーディオン（グループごと） -->
      <v-expansion-panels multiple flat>
        <v-expansion-panel
          v-for="(item, index) in event.groups"
          :key="index"
          class="mb-2 border rounded"
        >
          <!-- グループ名 -->
          <v-expansion-panel-header class="font-weight-bold text-subtitle-1 primary--text pa-3">
            <span>
              <v-icon color="primary" class="mr-2">mdi-account</v-icon>
              {{ item.performer }}
            </span>
          </v-expansion-panel-header>

          <!-- 中身（ステージ & 特典 & URLボタン） -->
          <v-expansion-panel-content class="pt-2">
            <div class="mb-2 body-1">
              <span class="font-weight-bold secondary--text">
                <v-icon small color="secondary" class="mr-1">mdi-stadium</v-icon>ステージ：
              </span>
              <span>{{ item.stage }}</span>
            </div>

            <div class="mb-3 body-1">
              <span class="font-weight-bold success--text">
                <v-icon small color="success" class="mr-1">mdi-gift</v-icon>入場特典：
              </span>
              <span>{{ item.perk }}</span>
            </div>

            <!-- ボタンエリア -->
            <div class="d-flex flex-wrap gap-2 mt-3">
              <!-- 公式X / 告知リンクボタン（データにURLがある場合のみ表示） -->
              <v-btn
                v-if="item.xUrl"
                outlined
                rounded
                color="primary"
                small
                class="mr-2 mb-2"
                :href="item.xUrl"
                target="_blank"
                rel="noopener noreferrer"
              >
                <v-icon small class="mr-1">mdi-open-in-new</v-icon>
                公式X / 告知を開く
              </v-btn>

              <!-- 情報提供（共通Googleフォームボタン） -->
              <v-btn
                outlined
                rounded
                color="orange darken-2"
                small
                class="mb-2"
                href="YOUR_GOOGLE_FORM_URL_HERE"
                target="_blank"
                rel="noopener noreferrer"
              >
                <v-icon small class="mr-1">mdi-file-document-edit-outline</v-icon>
                情報提供
              </v-btn>
            </div>
          </v-expansion-panel-content>
        </v-expansion-panel>
      </v-expansion-panels>
    </v-card-text>
  </v-card>
</template>

<script>
export default {
  name: 'EventCard',
  props: {
    event: {
      type: Object,
      required: true
    }
  }
};
</script>
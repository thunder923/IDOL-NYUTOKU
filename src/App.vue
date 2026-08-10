<template>
  <v-app>
    <v-main>
      <v-container>
        <!-- ヘッダー（タイトル ＆ 全体用情報提供ボタン） -->
        <div class="d-flex justify-space-between align-center mb-4">
          <h1 class="text-h4 font-weight-bold">イベント一覧</h1>
          <v-btn
            color="primary"
            rounded
            href="https://forms.gle/SbmwpBNLbBGUC3v39"
            target="_blank"
            rel="noopener noreferrer"
          >
            <v-icon left>mdi-pencil</v-icon>
            情報提供はこちら
          </v-btn>
        </div>

        <!-- ローディング表示 -->
        <div v-if="loading" class="text-center my-8">
          <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
          <p class="mt-4">データを読み込んでいます...</p>
        </div>

        <!-- カード一覧表示 -->
        <v-row v-else>
          <v-col
            v-for="event in events"
            :key="event.id"
            cols="12"
            md="6"
          >
            <EventCard :event="event" />
          </v-col>
        </v-row>
      </v-container>
    </v-main>
  </v-app>
</template>

<script>
import EventCard from './components/EventCard.vue';

export default {
  name: 'App',
  components: {
    EventCard
  },
  data() {
    return {
      loading: true,
      events: []
    };
  },
  mounted() {
    this.fetchEvents();
  },
  methods: {
    // 括弧 [ ] や引用符 " を自動削除
    cleanText(val) {
      if (val === null || val === undefined) return '';
      let str = typeof val === 'string' ? val : JSON.stringify(val);
      return str.replace(/[\[\]"]/g, '').trim();
    },

    // URLの自動補完 (https://)
    cleanUrl(val) {
      let str = this.cleanText(val);
      if (!str) return '';
      if (!str.startsWith('http://') && !str.startsWith('https://')) {
        str = 'https://' + str;
      }
      return str;
    },

    async fetchEvents() {
      // ↓ ご自身の GAS Webアプリ URL に差し替えてください
      const GAS_URL = 'https://script.google.com/macros/s/AKfycbyarH7Ur__WCEiQmqZROgCp1_I2G2hnRkXbRn7ckXQMr5DNutkQN1g7CLBh4Jj2q4iZ/exec';

      try {
        const response = await fetch(GAS_URL);
        const rawData = await response.json();

        const grouped = {};
        rawData.forEach(item => {
          const eventName = this.cleanText(item.eventName);
          if (!eventName) return;

          const key = item.id || eventName;

          if (!grouped[key]) {
            grouped[key] = {
              id: key,
              eventName: eventName,
              groups: []
            };
          }

          const performer = this.cleanText(item.performer || item.performers);
          const stage = this.cleanText(item.stage || item.stages);
          const perk = this.cleanText(item.perk || item.perks);
          const time = this.cleanText(item.time);
          
          // あらゆる列名に対応して URL を取得
          const rawUrl = item.xUrl || item.xurl || item.xURL || item.X || item.noticeUrl || item.url || item.link || '';
          const xUrl = this.cleanUrl(rawUrl);

          if (performer || stage || perk || time) {
            grouped[key].groups.push({
              performer: performer || '出演者未設定',
              stage: stage || 'なし',
              perk: perk || 'なし',
              time: time || '',
              xUrl: xUrl
            });
          }
        });

        this.events = Object.values(grouped);

      } catch (error) {
        console.error('データの取得に失敗しました:', error);
      } finally {
        this.loading = false;
      }
    }
  }
};
</script>
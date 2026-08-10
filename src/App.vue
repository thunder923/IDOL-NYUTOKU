<template>
  <v-app>
    <v-main>
      <v-container>
        <div class="d-flex justify-space-between align-center mb-4">
          <h1 class="text-h4 font-weight-bold">イベント一覧</h1>
          <v-btn
            color="primary"
            rounded
            href="https://forms.gle/uoyWWfV6WPnThwtT7"
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
    // 括弧や引用符をきれいにするクリーニング関数
    cleanText(val) {
      if (val === null || val === undefined) return '';
      let str = typeof val === 'string' ? val : JSON.stringify(val);
      return str.replace(/[\[\]"]/g, '').trim();
    },

    // URLのクリーニング関数
    cleanUrl(val) {
      const cleaned = this.cleanText(val);
      return cleaned.startsWith('http') ? cleaned : '';
    },

    async fetchEvents() {
      // ↓ ご自身のGAS URLに書き換えてください
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
          const xUrl = this.cleanUrl(item.xUrl || item.noticeUrl || item.url);

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
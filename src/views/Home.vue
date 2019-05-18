<template>
  <div class="home">
    <img class="haha" alt="Vue logo" v-preview="{
      max: 500
    }" src="../assets/example.jpg">
    <img  alt="Vue-logo" v-preview src="../assets/logo.png">
  </div>
</template>

<script>
// @ is an alias to /src
import preview from '@/directives/img-preview'
export default {
  name: 'home',
  directives: {
    preview
  }
}
</script>
<style lang="scss" scoped>
  .haha {
    width: 700px;
  }
</style>

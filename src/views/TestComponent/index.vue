<template>
  <div>
    niupi
    <div class="modal-parent" ref="parent"></div>
  </div>
</template>

<script>
import pop from './PopManager'
export default {
  name: 'Test',
  mounted () {
    console.log(this.$refs.parent)
    console.log(pop.openModal(1, 1, this.$refs.parent))
    console.log(pop)
  }
}
</script>

<style>

</style>

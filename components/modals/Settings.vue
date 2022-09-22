<template>
    <div>
        {{mod}}
        <!--
        <v-dialog @keydown.esc="close" @click:outside="close" v-model="visible" :max-width="500">
            dawdawugduyagw
            <slot v-if="value" :close="close">dawdawdawdwad</slot>
        </v-dialog> -->
    </div>
</template>

<script>
export default {
    name: "Settings",
    props: {
        visible: Boolean
    },
    methods: {
        close() {
            this.$emit('input', false)
        },
    },
    data: () =>({
        mod: false
    })
}
</script>

<style>

</style>
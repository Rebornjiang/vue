/* @flow */

import { mergeOptions } from '../util/index'

// 全局混入
// 将传入的 组件选项跟  Vue.options 选项进行合并。 
export function initMixin (Vue: GlobalAPI) {
  Vue.mixin = function (mixin: Object) {
    this.options = mergeOptions(this.options, mixin)
    console.log({beforeVue: this})
    return this
  }
}

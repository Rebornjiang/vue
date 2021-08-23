/* @flow */

import { toArray } from '../util/index'

export function initUse (Vue: GlobalAPI) {
  Vue.use = function (plugin: Function | Object) {
    // 在 Vue 身上维护一个installedPlugins 列表，存储已经注册的插件。
    const installedPlugins = (this._installedPlugins || (this._installedPlugins = []))

    // 如果有直接返回 Vue
    if (installedPlugins.indexOf(plugin) > -1) {
      return this
    }

    // 用于获取调用Vue.use(plugin, paramA, paramB)除了插件本身的剩余参数
    // 该方法会返回[paramA, paramB]
    // additional parameters
    const args = toArray(arguments, 1)
    // 将 Vue 添加参数最前面
    args.unshift(this)
    if (typeof plugin.install === 'function') {
      // plugin 为 Obj 的情况 
      plugin.install.apply(plugin, args)
    } else if (typeof plugin === 'function') {
      // plugin 为函数的情况
      plugin.apply(null, args)
    }
    
    // 存储已经注册的插件
    installedPlugins.push(plugin)
    return this
  }
}

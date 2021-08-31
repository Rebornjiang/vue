/* @flow */

import { ASSET_TYPES } from 'shared/constants'
import { isPlainObject, validateComponentName } from '../util/index'

export function initAssetRegisters(Vue: GlobalAPI) {
  /**
   * Create asset registration methods.
   */
  ASSET_TYPES.forEach(type => {
    Vue[type] = function (
      id: string,
      definition: Function | Object
    ): Function | Object | void {
      if (!definition) {
        return this.options[type + 's'][id]
      } else {
        /* istanbul ignore if */
        if (process.env.NODE_ENV !== 'production' && type === 'component') {
          validateComponentName(id)
        }
        // 注册组件，传入一个选项对象 (自动调用 Vue.extend)
        if (type === 'component' && isPlainObject(definition)) {
          definition.name = definition.name || id
          definition = this.options._base.extend(definition)
        }

        // 注册指令传入指令函数， 会自动封装为 {bind: definition, update: definition} 这种格式
        if (type === 'directive' && typeof definition === 'function') {
          definition = { bind: definition, update: definition }
        }

        // 将其存储在记录全局指令，组件，过滤器中 Vue.options[type] 
        this.options[type + 's'][id] = definition
        return definition
      }
    }
  })
}

/**
 * @file 工具方法
 * @author xlst(x_l_st@126.com)
 */

define(function (require) {
    var ui = {
        /**
         * @method replaceEcui 使用 新ecui组件 替换 旧ecui组件（主要就是插入新组件的DOM元素，析构和删除旧元素）
         * @param {ecui.ui} oldEcui 旧ecui组件
         * @param {ecui.ui} newEcui 新ecui组件（已经初始化后的）
         */
        replaceEcui: function (oldEcui, newEcui) {
            var oldElement = oldEcui.getMain();
            var newElement = newEcui.getMain();
            
            //  将新元素节点插入到DOM中
            T.dom.insertAfter(newElement, oldElement);
            //  移除旧组件
            oldEcui.dispose();
            T.dom.remove(oldElement);
        }
    };
    
    var select = {
        /**
         * @method setData 根据源数据数组，使用add方法填充select的下拉项，可自定义过滤器，可设置默认值或下拉列表项索引。
         * @param {Object} option 配置参数对象，详见下述列表：
         * @param {Object} option.ecuiSelect 已经初始化后的ecui select控件。
         * @param {Array=} option.dataList 数据源。格式形如[{text: '显示文本', value: '表单值'}, {跟前面那个一样}]。
         * @param {Function(value, text)= :boolean} option.filter 自定义的过滤器，可选。
         *          通过这个过滤器可决定是否将数据源的某一项添加到select中。
         *          option.filter在遍历每一个dataList的元素时会被调用，如果option.filter返回false，则该项不被add到select中。
         *          option.filter接受两个参数，第一个是【当前遍历对象】的value，第二个参数是【当前遍历对象】的text。
         *          在option.filter中，this指向【当前遍历对象】。可使用this.value取到【当前遍历对象】的value。
         *          由于本方法使用的是dataList的深拷贝副本，因此可以在filter中放心地设置this对象的属性，如：【this.value += 1】。
         * @param {boolean=} option.setDefaultValue 是否设置select的默认值。默认为true，表示自动设置select的默认值。
         *          自动设置select的默认值规则：首先使用defaultValue，如果没有defaultValue，则使用defaultIndex对应的值。
         *          如果defaultIndex也没有，则使用过滤后的下拉列表的第一项作为select的默认值。
         * @param {string|number=} option.defaultValue 需要设置的 select的默认值。
         * @param {string|number=} option.defaultIndex 需要设置的 默认select项目索引。
         * 
         */
        setData: function (option) {
            var ecuiSelect = option.ecuiSelect;
            //  拷贝一份 数据源 的副本，这样就可以在filter中，通过this改变text和value，但不会影响原数据源
            var dataList = T.object.clone(option.dataList);
            var filter = option.filter;
            var setDefaultValue = option.setDefaultValue;
            var defaultValue = option.defaultValue;
            var defaultIndex = option.defaultIndex;
            var itemIndex = 0;
            var itemIndexValueMap = {};
            
            ecuiSelect.clear();
            
            //  由于Tangram的数组each方法没有对参数做有效性检查，所以这里提前容错。
            //  这样，调用本setData工具方法时，就不必考虑有时异常的ajax数据
            if (!T.lang.isArray(dataList)) {
                dataList = [];
            }
            
            T.array.each(
                dataList,
                function (item, index) {
                    if (typeof filter !== 'function'
                        || filter.call(item, item.value, item.text) !== false
                    ) {
                        ecuiSelect.add(item.text, null, { value: item.value });
                        
                        //  保存过滤后的 下拉项索引与value 的映射关系
                        itemIndexValueMap[itemIndex++] = item.value;
                    }
                }
            );
            
            //  当setDefaultValue不为false时，则给ecuiSelect控件设置默认value
            if (setDefaultValue !== false) {
                if (defaultValue !== undefined) {
                    ecuiSelect.setValue(defaultValue);
                }
                else {
                    defaultIndex = (defaultIndex !== undefined) ? defaultIndex : 0;
                    
                    //  当itemIndexValueMap有defaultIndex对应值时，才给ecuiSelect控件设置默认值
                    if (itemIndexValueMap[defaultIndex] !== undefined) {
                        ecuiSelect.setValue(itemIndexValueMap[defaultIndex]);
                    }
                }
            }
        }
    };
    
    var queryTab = (function () {
        /**
         * @method getItems 从页面上已经初始化后的`query-tab`组件中，提取`tab`标签的配置数据
         * @param {ecui.ui.QueryTab} ecuiQueryTab 页面上**已经初始化后**的`type`为`query-tab`的**ecui组件**
         * @return {Array} 返回原来tab的配置数据。数组元素的结构为`{text: "", value: ""}`。
         *                  其中`text`为标签名，`value`为标签内部“id值”。
         *                  2013.11.25升级后，text支持包含原始标签信息（即outerHTML）。
         */
        function getItems(ecuiQueryTab) {
            //  返回原来query-tab组件的配置数据（text与value）
            return T.array.map(
                ecuiQueryTab.getItems(),
                function (item) {
                    var text = item.getMain().firstChild.outerHTML;
                    
                    //  ①如果firstChild是文本节点，则没有outerHTML属性；
                    //  ②低版本火狐的元素节点，也没有outerHTML属性
                    if (!text) {
                        //  如果是以上原因没有取到text，则使用getText方式获取文本
                        text = T.dom.getText(item.getMain().firstChild);
                    }
                    
                    return {
                        text: text,
                        value: item.getValue()
                    }
                }
            );
        }
        
        /**
         * @method replaceEcuiQueryTab （根据配置数据）使用新的`type:query-tab`组件代替原来页面中的该组件
         * @param {ecui.ui.QueryTab} ecuiQueryTab 页面上**已经初始化后**的`type`为`query-tab`的**ecui组件**
         * @param {Array} items 配置数据。数组元素的结构为`{text: "", value: ""}`。
         *                  其中`text`为标签名，`value`为标签内部“id值”
         * @param {string|number=} defaultValue 新创建的`query-tab`的默认值，如果不传，则保持原组件`ecuiQueryTab`的值
         * @return {ecui.ui.QueryTab} 返回新的`type:query-tab`组件
         */
        function replaceEcuiQueryTab(ecuiQueryTab, items, defaultValue) {
            var queryTabElement = ecuiQueryTab.getMain();
            var newQueryTabElement = document.createElement('div');
            
            //  保留原来的DOM节点id（如果有）
            if (queryTabElement.id !== '') {
                newQueryTabElement.id = queryTabElement.id;
            }
            //  处理默认选中的tab值
            var value = (defaultValue === undefined || defaultValue === '')
                        ? '' : 'value' + defaultValue;
            T.dom.setAttr(
                newQueryTabElement,
                'ecui', 'type:query-tab;id:myTab;' + value
            );
            //  构建html
            var tabHTML = [];
            T.array.each(
                items,
                function (item) {
                    tabHTML = tabHTML.concat([
                        '<span ecui="value:', item.value, '">',
                            item.text,
                        '</span>'
                    ]);
                }
            );
            newQueryTabElement.innerHTML = tabHTML.join('');
            
            //  初始化为ecui组件
            //  事实证明，ecui.init没有返回已经初始化好的ecui对象。下面用自己加的id重新获取
            var newEcuiQueryTab = ecui.init(newQueryTabElement).myTab;
            newEcuiQueryTab.onchange = ecuiQueryTab.onchange;
            //  设置默认选中的tab 或（没有defaultValue时）保留原来的选中状态
            if (defaultValue !== undefined) {
                newEcuiQueryTab.setValue(defaultValue);
            }
            else {
                newEcuiQueryTab.setValue(ecuiQueryTab.getValue());
            }
            
            //  在页面上 使用新组件 代替 旧组件
            ui.replaceEcui(ecuiQueryTab, newEcuiQueryTab);
            
            return newEcuiQueryTab;
        }
        
        return {
            /**
             * @method add “增加”`type:query-tab`组件的标签（其实是障眼法，内部实现使用新`type:query-tab`组件代替旧的组件）
             * @param {ecui.ui.QueryTab} ecuiQueryTab 页面上**已经初始化后**的`type`为`query-tab`的**ecui组件**
             * @param {Object|Array.<Object>} items 添加的新**tab标签**的配置，结构为`{text: "", value: ""}`。可以使用数组包含多个配置
             * @param {string|number=} defaultValue 添加**tab标签**后，组件的默认值，如果不传，则保持原`query-tab`组件的值
             * @return {ecui.ui.QueryTab} 返回新的`type:query-tab`组件
             */
            add: function (ecuiQueryTab, item, defaultValue) {
                var newQueryTabItems = getItems(ecuiQueryTab);
                
                if (T.lang.isArray(item)) {
                    newQueryTabItems = newQueryTabItems.concat(item);
                }
                else {
                    newQueryTabItems.push(item);
                }
                
                return replaceEcuiQueryTab(
                    ecuiQueryTab, newQueryTabItems,
                    defaultValue
                );
            },
            /**
             * @method remove “删除”`type:query-tab`组件的标签（其实是障眼法，内部实现使用新`type:query-tab`组件代替旧的组件）
             * @param {ecui.ui.QueryTab} ecuiQueryTab 页面上**已经初始化后**的`type`为`query-tab`的**ecui组件**
             * @param {string|Array.<string>} values 要删除的**tab标签**对应的`value`。参数类型可以为字符串或字符串数组
             * @param {string|number=} defaultValue 删除**tab标签**后，组件的默认值，如果不传，则保持原`query-tab`组件的值
             * @return {ecui.ui.QueryTab} 返回新的`type:query-tab`组件
             */
            remove: function (ecuiQueryTab, values, defaultValue) {
                var items = getItems(ecuiQueryTab);
                var newQueryTabItems = null;
                
                if (!T.lang.isArray(values)) {
                    values = [values];
                }
                
                /*
                 * 下面的代码，将从一个数组中，删除指定的多个值（这多个值在另一个数组中定义）。
                 * 使用的是暴力穷举法，算法效率有待提高。。。
                 * 删除数组算法：每删除一个指定的值，需要遍历一次原数组。而现在需要删除很多值，所以需要双重遍历
                 */
                //  外层遍历要删除的value，然后由每次的内层遍历删除一个value
                T.array.each(
                    values,
                    function (value) {
                        if (T.lang.isNumber(value)) {
                            value = String(value);
                        }
                        
                        //  每次遍历需要重新置空newQueryTabItems
                        newQueryTabItems = [];
                        //  内层遍历原数组。每个完整遍历 删除一个value
                        T.array.each(
                            items,
                            function (item) {
                                //  如果不是需要删除的值，则加入newQueryTabItems（间接删除法）
                                if (item.value !== value) {
                                    newQueryTabItems.push(item);
                                }
                            }
                        );
                        //  每次内层遍历之后，使用newQueryTabItems作为新的items
                        items = newQueryTabItems;
                    }
                );
                
                return replaceEcuiQueryTab(
                    ecuiQueryTab, newQueryTabItems,
                    defaultValue
                );
            },
            /**
             * @method hasTab 判断是否已有**tab标签**
             * @param {ecui.ui.QueryTab} ecuiQueryTab 页面上**已经初始化后**的`type`为`query-tab`的**ecui组件**
             * @param {string|number=} value **tab标签**对应的值
             * @return {boolean} 如果有组件中包含该`value`的**tab标签**，则返回`true`。没有包含则返回`false`
             */
            hasTab: function (ecuiQueryTab, value) {
                var items = getItems(ecuiQueryTab);
                var hasTab = false;
                
                if (T.lang.isNumber(value)) {
                    value = String(value);
                }
                
                T.array.each(
                    items,
                    function (item) {
                        if (item.value === value) {
                            hasTab = true;
                        }
                    }
                );
                
                return hasTab;
            }
        };
    })();
    
    var treeView = {
        /**
         * @method addNodes 根据参数数据，批量添加子节点（包含子节点的无限级子节点）
         * @param {ecui.ui.TreeView} parentNode 父节点
         * @param {Array} dataList 格式形如`[{text: '', value:'', children: []}]`。
         *                  其中，`children`的格式是`dataList`的格式
         * @param {function(text, value)= :string|false} processText 可选。
         *                  作用①对子节点的显示文本进行处理；作用②处理`value`。
         *                  如果`processText`没有返回值，则该参数没有实际作用；
         *                  如果返回`false`，则不添加该子节点；
         *                  其它返回值，则作为 子节点的显示文本（不对字符串中包含的html标签进行转义）。
         *                  函数接收两个参数，分别为`dataList`元素项的`text`和`value`。
         *                  函数中，`this`指向当前遍历的`dataList`元素项，如：可以访问`this.children`等 没有作为参数传递的值。
         */
        addNodes: function recursion(parentNode, dataList, processText) { //  recursion函数名 供递归时 使用
            T.array.each(
                dataList,
                function (item) {
                    var text = item.text;
                    
                    if (typeof processText === 'function') {
                        text = processText.call(item, item.text, item.value);
                        
                        if (text === false) {
                            return;
                        }
                        else if (text === undefined) {
                            text = item.text;
                        }
                    }
                    
                    var newNode = parentNode.add(text);
                    
                    if (item.children.length > 0) {
                        recursion(newNode, item.children, processText);
                    }
                }
            );
        }
    };
    
    var dom = {
        /**
         * @method makeTiptool 制作【提示工具】（并且通过css类对文本做溢出隐藏处理）。
         *                  设计初衷主要是将过长的单元格数据“截断”，并在鼠标悬浮时显示完整的原始文本。
         *                  注意：引用页面需要【.text-overflow】css类，如下：
         *                  ```
         *                  .text-overflow {
         *                      overflow: hidden;
         *                      white-space: nowrap;
         *                      text-overflow: ellipsis;
         *                  }
         *                  ```
         * @param {string} text 需要“包装”的文本
         * @param {string=} title “包装”后显示的提示文本。如果省略该参数，则默认使用 完整的`text`作为提示文本。
         * @param {string=} text 给“包装”容器附加的额外css类名。该参数传递与否，“包装”容器都会有默认的【.text-overflow】css类
         * @return {string} “包装”后的文本（具有自动隐藏溢出文本、鼠标悬浮显示完整文本 功能）
         */
        makeTiptool: function (text, title, className) {
            title = (title === undefined) ? text : title;
            className = (className === undefined)
                        ? 'text-overflow'
                        : 'text-overflow ' + className;
            
            //  TODO 对text-overflow进行存在性判断，如果不存在，则创建style元素，加入text-overflow类
            return [
                '<div class="', className, '" title="', title, '">',
                    text,
                '</div>'
            ].join('');
        }
    };
    
    var date = {
        /**
         * @method getQuarter 获取季度（字符串）
         * @param {Date=} date 日期，若没传该参数则使用当前系统时间
         * @return {string} 季度字符串，格式yyyy-MM-dd。其中，【MM-dd】只取[01-01, 04-01, 07-01, 10-01]值一
         */
        getQuarter: function (date) {
            if (!(date instanceof Date)) {
                date = new Date();
            }
            
            // var quarter = Math.floor(date.getMonth()/3)*3+1;
            var quarter = date.getMonth() - date.getMonth()%3 + 1;
            
            return date.getFullYear() + '-' + T.number.pad(quarter, 2) + '-01';
        }
    };
    
    var tools = {
        /**
         * @method dataListToMap 数组到Map的格式转换。将一个[{text: "", value: ""}]数组，转成一个 value-text型的Map
         * @param {Array.<Object>} dataList 需要转换的数组，数组元素的结构为`{text: "", value: ""}`
         * @param {Object=} dataModel 数据模型，可选。通过该模型 可以指定数组中元素的哪些属性 作为Map的key和value。
         *                              默认情况下，将使用数组元素的value和text 分别作为Map的key和value。
         *                              即，默认情况下，dataModel为`{ fieldKey: 'value', fieldValue: 'text' }`
         * @return {Object} 转换之后的Map映射
         */
        dataListToMap: function (dataList, dataModel) {
            dataList = dataList || [];
            dataModel = dataModel || {};
            
            var dataMap = {};
            var fieldKey = dataModel.fieldKey || 'value';
            var fieldValue = dataModel.fieldValue || 'text';
            
            //  TODO 对 `text` 字段加一个自定义处理函数，类似treeView.addNodes的第三个参数processText
            T.array.each(
                dataList,
                function (item) {
                    dataMap[item[fieldKey]] = item[fieldValue];
                }
            );
            
            return dataMap;
        }
    };
    
    return {
        dom: dom,
        
        ui: ui,
        select: select,
        queryTab: queryTab,
        treeView: treeView,
        
        date: date,
        
        tools: tools
    };
});
//试试分支提交

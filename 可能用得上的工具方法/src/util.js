/**
 * @file 工具方法
 * @author xlst(x_l_st@126.com)
 */

define(function (require) {
    var select = {
        /**
         * @method setData 根据源数据数组，使用add方法填充select的下拉项，可自定义过滤器，可设置默认值或下拉列表项索引。
         * @param {Object} option 配置参数对象，详见下述列表：
         * @param {Object} option.ecuiSelect 已经初始化后的ecui select控件。
         * @param {Array=} option.dataList 数据源。格式形如[{text: '显示文本', value: '表单值'}, {跟前面那个一样}]。
         * @param {Function=} option.filter 自定义的过滤器，可选。通过这个过滤器可决定是否将数据源的某一项添加到select中。
         *          option.filter在遍历每一个dataList的元素时会被调用，如果option.filter返回false，则该项不被add到select中。
         *          option.filter接受两个参数，第一个是【当前遍历对象】的value，第二个参数是【当前遍历对象】的text。
         *          在option.filter中，this指向【当前遍历对象】。可使用this.value取到【当前遍历对象】的value。
         *          由于本方法使用的是dataList的深拷贝副本，因此可以在filter中放心地设置this对象的属性，如：【this.value+=1】。
         * @param {Boolean=} option.setDefaultValue 是否设置select的默认值。默认为true，表示自动设置select的默认值。
         *          自动设置select的默认值规则：首先使用defaultValue，如果没有defaultValue，则使用defaultIndex对应的值。
         *          如果defaultIndex也没有，则使用过滤后的下拉列表的第一项作为select的默认值。
         * @param {String|Number=} option.defaultValue 需要设置的 select的默认值。
         * @param {String|Number=} option.defaultIndex 需要设置的 默认select项目索引。
         * 
         */
        setData: function (option){
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
            if(!T.lang.isArray(dataList)){
                dataList = [];
            }
            
            T.array.each(dataList, function (item, index){
                if(typeof filter !== 'function' || filter.call(item, item.value, item.text) !== false){
                    ecuiSelect.add(item.text, null, {value: item.value});
                    
                    //  保存过滤后的 下拉项索引与value 的映射关系
                    itemIndexValueMap[itemIndex++] = item.value;
                }
            });
            
            //  当setDefaultValue不为false时，则给ecuiSelect控件设置默认value
            if(setDefaultValue !== false){
                if(defaultValue !== undefined){
                    ecuiSelect.setValue(defaultValue);
                }else{
                    defaultIndex = (defaultIndex !== undefined) ? defaultIndex : 0;
                    
                    //  当itemIndexValueMap有defaultIndex对应值时，才给ecuiSelect控件设置默认值
                    if(itemIndexValueMap[defaultIndex] !== undefined){
                        ecuiSelect.setValue(itemIndexValueMap[defaultIndex]);
                    }
                }
            }
        }
    };
    
    var dom = {
        /**
         * @method mackTiptool 制作【提示工具】（并且通过css类对文本做溢出隐藏处理）。
         *                  设计初衷主要是将过长的单元格数据“截断”，并在鼠标悬浮时显示完整的原始文本。
         *                  注意：引用页面需要【.text-overflow】css类
         * @param {String} text 需要“包装”的文本
         * @return {String} “包装”后的文本（具有自动隐藏溢出文本、鼠标悬浮显示完整文本 功能）
         */
        mackTiptool: function (text){
            return '<div class="textOverflow" title="' + text + '">' + text + '</div>';
        }
    };
    
    var date = {
        /**
         * @method getQuarter 获取季度（字符串）
         * @param {Date=} date 日期，若没传该参数则使用当前系统时间
         * @return {String} 季度字符串，格式yyyy-MM-dd。其中，【MM-dd】只取[01-01, 04-01, 07-01, 10-01]值一
         */
        getQuarter: function (date){
            if(!(date instanceof Date)){
                date = new Date();
            }
            
            // var quarter = Math.floor(date.getMonth()/3)*3+1;
            var quarter = date.getMonth() - date.getMonth()%3 + 1;
            
            return date.getFullYear() + '-' + T.number.pad(quarter, 2) + '-01';
        }
    }
    
    return {
        dom: dom,
        select: select,
        date: date
    };
});

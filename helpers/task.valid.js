const TaskModel = require('../models/task.model')

const { isPast } = require('date-fns')

const TaskValidation = async(req, res, next) => {
    const { macaddress, type, title, description, when } = req.body

    if (!macaddress) {
        return res.status(400).json({error: 'o campo de macaddress é obrigatório!'})
    } else if (!type){
        return res.status(400).json({error: 'o campo de tipo é obrigatório!'})
    } else if (!title){
        return res.status(400).json({error: 'o campo de título é obrigatório!'})
    } else if (!description){
        return res.status(400).json({error: 'o campo de descrição é obrigatório!'})
    } else if (!when){
        return res.status(400).json({error: 'A data e a hora são obrigatórias!'})
    }  else {
        
        let exists
        
        if (req.params.id) {
            exists = await TaskModel.findOne({ '_id': {'$ne': req.params.id},'when': {'$eq': new Date(when)}, 'macaddress': {'$in': macaddress} })
        } else {
            if (isPast(new Date(when))){ //You can not add tasks before now
                return res.status(400).json({error: 'Escolha uma data e hora futura!'})  
            }
        
            exists = await TaskModel.findOne({ 'when': {'$eq': new Date(when)}, 'macaddress': {'$in': macaddress} })
        
        }
        
        if (exists) {
            return res.status(400).json({error: 'Já existe uma tarefa neste dia e horário!'})
        } else {
            next()
        }
        
        
    } 
}

module.exports = TaskValidation
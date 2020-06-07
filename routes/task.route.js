const express = require('express')
const router = express.Router()

const TaskController = require('../controllers/task.controller')

const TaskValidation = require('../helpers/task.valid')



// POST
//quando chegar uma requisição no para post, primeiro executa o Validation e depois o controller(se passar pela validacao)
router.post('/', TaskValidation, TaskController.create)


// PUT
//update by id
router.put('/:id', TaskValidation, TaskController.update)

//tarefas com done:true or false
router.put('/:id/:done', TaskController.done )


// DELETE
//eliminação de registros
router.delete('/:id', TaskController.delete)


// GET
//mostra todas as tarefas relativas a um dado macaddress
router.get('/filter/all/:macaddress',  TaskController.all)

//mostra uma única tarefa por id
router.get('/:id', TaskController.show)

//obter tarefas atrasadas
router.get('/filter/late/:macaddress', TaskController.late)

//obter tarefas do dia
router.get('/filter/today/:macaddress',  TaskController.today)

//obter tarefas da semana
router.get('/filter/week/:macaddress',  TaskController.week)

//obter tarefas do mês
router.get('/filter/month/:macaddress',  TaskController.month)

//obter tarefas do ano
router.get('/filter/year/:macaddress',  TaskController.year)





module.exports = router
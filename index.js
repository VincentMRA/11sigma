const express = require('express');
const { graphqlHTTP } = require('express-graphql');
const cors=require('cors')
const { graphql, buildSchema } = require('graphql');
const axios = require('axios')
const gh = require('parse-github-url');

axios.defaults.headers.common['Bearer']=process.env.API_TOKEN
axios.defaults.headers.common['Access-Control-Allow-Origin']= '*'
const schema = buildSchema(`
  type Query {
    repo(url:String!, maxNumber:Int): Repo
  }
  type Repo {
    repo_name:String
    owner: String
    url:String
    apiURL:String
    contributors: [Contributor]
  }
  type Contributor{
    id:String
    url:String
    avatarUrl:String
    contributions:String
    adds:Int
    dels:Int
    total:Int
    commits:Int
  }
`);

class Repo {
    constructor(repo){
        console.log(repo)
        let ghInfo=gh(repo.url)
        this.owner=ghInfo.owner
        this.repo_name=ghInfo.name
        this.url=repo.url
        this.apiURL="https://api.github.com/repos/"+ghInfo.repo+"/stats/contributors"
    }
    async contributors() {
        let contributors
        console.log(this.apiURL)
        await axios.get(this.apiURL)
        .then(res=>{ 
          contributors=res.data.map(contr=> {
            let adds=0
            let dels=0
            let commits=0
            contr.weeks.forEach(x=>{
              adds+=x.a
              dels+=x.d
              commits+=x.c
            })
            console.log(contr.author.login,": ",adds," , ",dels,", ",commits)
            return {
              id:contr.author.login,
              url:contr.author.url,
              avatarUrl:contr.author.avatar_url,
              contributions:contr.total,
              adds:adds,
              dels:dels,
              total:adds+dels,
              commits:commits
          }})
          
      })
        return contributors
    }
}
 
var root = { 
    repo:(args) => {
        console.log(args)
        let repo= new Repo(args)
        return  repo
    }
};
 

const app = express();
app.use(cors())
app.use(
  '/graphql',
  graphqlHTTP({
    schema,
    rootValue: root,
    graphiql: true,
  }),
);
const port= process.env.PORT || 4000
app.listen(port, () => {console.log("SERVER RUNNING! on port: ", port )});

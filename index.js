const express = require('express');
const { graphqlHTTP } = require('express-graphql');

const { graphql, buildSchema } = require('graphql');
const axios = require('axios')
var gh = require('parse-github-url');

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
    id:Int
    url:String
    avatarUrl:String
    contributions:Int
  }
`);

class Repo {
    constructor(repo){
        console.log(repo)
        let ghInfo=gh(repo.url)
        this.owner=ghInfo.owner
        this.repo_name=ghInfo.name
        this.url=repo.url
        this.apiURL="https://api.github.com/repos/"+ghInfo.repo+"/contributors"
        if (repo.maxNumber){
            this.apiURL+='?page=1&per_page='+repo.maxNumber.toString()
        } else {
            this.apiURL+='?page=1&per_page=10'
        }
        console.log(this.apiURL)
    }
    async contributors() {
        let contributors
        console.log(this.apiURL)
        await axios.get(this.apiURL)
        .then(res=>{ 
            console.log(res.data)
            contributors=res.data.map(contr=> {return {
                id:contr.id,
                url:contr.url,
                avatarUrl:contr.avatar_url,
                contributions:contr.contributions
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

app.use(
  '/graphql',
  graphqlHTTP({
    schema,
    rootValue: root,
    graphiql: true,
  }),
);
const port= process.env.PORT || 4000
app.listen(port, () => {console.log("SERVER RUNNING!")});

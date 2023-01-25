import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import sanityClient from "../client.js";

export default function AllPosts() {
  const [allPostsData, setAllPosts] = useState(null);

  useEffect(() => {
    sanityClient
      .fetch(
        `*[_type == "post"] | order(publishedAt desc) [0..5]{
            title,
            slug,
            mainImage{
              asset->{
                _id,
                url
              }
            }
          }`
      )
      .then((data) => setAllPosts(data))
      .catch(console.error);
  }, []);

  console.log(allPostsData);

  function loadAll() {
   
    sanityClient
      .fetch(
        `*[_type == "post"] | order(publishedAt desc){
            title,
            slug,
            publishedAt,
            "name": author->name,
            "authorImage": author->image,
            mainImage{
              asset->{
                _id,
                url
              }
            }
          }`
      )
      .then((data) => setAllPosts(data))
      .catch(console.error);
   ;
  }

  
const linkStyle = {
  textDecoration: "none",
  backgroundColor: "rgba(0,0,0,0)",
  color: "#000"
};



  return (
    <div className="terminal">
      <div className="container">
        <div className="row">
          {allPostsData &&
            allPostsData.map((post, index) => (
             
                <span
                className="column"
                  key={index}
                >
                   
                  <div style={{height: "230px", margin: "10px"}} className="terminal-card">
                    <header>{post.title}</header>
                    <Link style={linkStyle} to={"/" + post.slug.current} key={post.slug.current}>

                    <div>
                    <img
                    style={{maxHeight: "160px", width: "auto", margin: "auto", marginTop: "16px", mixBlendMode: "luminosity", opacity: "0.75"}}
                    src={post.mainImage.asset.url}
                    alt=""
                  />


                    </div>
                    </Link>
                  </div>

                  
                </span>
             
            ))}
        </div>
        <h1 style={{ cursor: "pointer" }} onClick={loadAll} className="terminal-prompt typeEffect">would you like to load more...</h1>

      </div>
    </div>
    
  );
}

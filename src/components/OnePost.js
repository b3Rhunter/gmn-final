import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import sanityClient from "../client.js";
import BlockContent from "@sanity/block-content-to-react";
import imageUrlBuilder from "@sanity/image-url";

const builder = imageUrlBuilder(sanityClient);
function urlFor(source) {
  return builder.image(source);
}

export default function OnePost() {
  const [postData, setPostData] = useState(null);
  const { slug } = useParams();

  const headlineStyle = {
    color: "#fff"
  }

  useEffect(() => {
    sanityClient
      .fetch(
        `*[slug.current == "${slug}"]{
            title,
            slug,
            mainImage{
              asset->{
                _id,
                url
              }
            },
            body,
            "name": author->name,
            "authorImage": author->image
          }`
      )
      .then((data) => setPostData(data[0]))
      .catch(console.error);
  }, [slug]);

  if (!postData) return <div>Loading...</div>;

  return (
    <div className="terminal">
      <div className="container">
        <div>
          <div className="h-full w-full">
            {/* Title Section */}
            <div>
              <div>
                <h1 style={{color: "#fff"}} className="terminal-prompt typeEffect">
                  Written by: {postData.name}
                </h1>
              </div>
            </div>
          </div>

        </div>
        <div style={{color: "#fff", textAlign: "justify"}} className="onePost">
          <BlockContent
            style={headlineStyle}
            blocks={postData.body}
            projectId={sanityClient.clientConfig.projectId}
            dataset={sanityClient.clientConfig.dataset}
          />
        </div>
      </div>
    </div>
  );
}

import React, { useEffect, useState, useContext } from 'react';
import { UserContext } from '../../App'

const Profile = () => {
    const [mypics, setPics] = useState([])
    const { state, dispatch } = useContext(UserContext)
    const [image, setImage] = useState("")
    useEffect(() => {
        fetch('/mypost', {
            headers: {
                Authorization: "Bearer " + localStorage.getItem('jwt')
            }
        }).then(res => res.json())
            .then(result => {
                setPics(result.mypost)
            })
    }, [])
    useEffect(() => {
        if (image) {
            const data = new FormData()
            data.append('file', image)
            data.append('upload_preset', "insta-clone")
            data.append('cloud_name', 'durairaj')
            fetch("https://api.cloudinary.com/v1_1/durairaj/image/upload", {
                method: "post",
                body: data
            })
                .then(res => res.json())
                .then(data => {
                    fetch('/updatepic', {
                        method: "put",
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": "Bearer " + localStorage.getItem('jwt')
                        },
                        body: JSON.stringify({
                            pic: data.url
                        })
                    }).then(res => res.json())
                        .then(result => {
                            console.log(result)
                            dispatch({ type: "UPDATEPIC", payload: result.pic })
                            localStorage.setItem("user", JSON.stringify({ ...state, pic: result.pic }))
                            window.location.reload()
                        })
                })
                .catch(err => {
                    console.log(err)
                })
        }
    }, [image])
    const updatePhoto = (file) => {
        setImage(file)
    }

    return (
        <>
            {state ? <div style={{ maxWidth: "550px", margin: "0px auto" }}>
                <div style={{
                    display: "flex",
                    justifyContent: "space-around",
                    margin: "18px 0px",
                    borderBottom: "1px solid grey"
                }}>
                    <div>
                        <img style={{ width: "160px", height: "160px", borderRadius: "80px" }}
                            src={state ? state.pic : "loading"} />
                        <div className="file-field input-field">
                            <div className="btn #64b5f6 blue darken-1">
                                <span>Update Profile Picture</span>
                                <input type="file"
                                    onChange={(e) => updatePhoto(e.target.files[0])}
                                />
                            </div>
                            <div className="file-path-wrapper">
                                <input className="file-path validate" type="text" />
                            </div></div>
                    </div>
                    <div>
                        <h4>{state ? state.name : "loading"}</h4>
                        <h5>{state ? state.email : "loading"}</h5>
                        <div style={{ display: "flex", justifyContent: "space-between", width: "108%" }}>
                            <h6>{mypics.length} Posts</h6>
                            <h6>{state.followers.length} followers</h6>
                            <h6>{state.following.length} following</h6>
                        </div>
                    </div>
                </div>
                <div className="gallery">
                    {
                        mypics.map(item => {
                            return (<img key={item._id} className="item" src={item.photo} alt={item.title} />)
                        })
                    }
                </div>
            </div> :
                "loading"}
        </>
    )
}

export default Profile


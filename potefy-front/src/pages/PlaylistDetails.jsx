import { useParams } from "react-router-dom";

export default function PlaylistDetails() {
    const { id } = useParams();

    return (
        <div>
            <h1>
                Playlist {id}
            </h1>
        </div>
    );
}
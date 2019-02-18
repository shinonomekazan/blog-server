import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
admin.initializeApp(functions.config().firebase);
const firestore = admin.firestore();

interface UserPost {
	subject: string;
	body: string;
	created: FirebaseFirestore.Timestamp;
	updated: FirebaseFirestore.Timestamp;
}

interface AllPost {
	userId: string;
	userName: string;
	postRef: FirebaseFirestore.DocumentReference;
	userDisplayName: string;
	subject: string;
	body: string;
	created: FirebaseFirestore.Timestamp;
	updated: FirebaseFirestore.Timestamp;
}

interface UserData {
	id: string;
	created: FirebaseFirestore.Timestamp;
	name: string;
	displayName: string;
}

async function copyToAllPost(snapshot: FirebaseFirestore.DocumentSnapshot, context: functions.EventContext) {
	const userName: string = context.params.userName;
	// const postId: string = context.params.postId;
	const post = snapshot.data() as UserPost;
	try {
		const user = await firestore.collection("users").doc(userName).get();
		const userData = user.data() as UserData;
		const allPost = {
			userId: userData.id,
			userName: userData.name,
			userDisplayName: userData.displayName,
			postRef: snapshot.ref,
			created: post.created,
			updated: post.updated,
			subject: post.subject,
			body: post.body,
		} as AllPost;
		return await firestore.collection("allPosts").add(allPost);
	} catch (error) {
		return Promise.reject(error);
	}
}

async function updateToAllPost(change: functions.Change<FirebaseFirestore.DocumentSnapshot>, context: functions.EventContext) {
	const userName: string = context.params.userName;
	// const postId: string = context.params.postId;
	const oldPostRef = change.before!.ref
	const post = change.after!.data() as UserPost;
	try {
		const user = await firestore.collection("users").doc(userName).get();
		const userData = user.data() as UserData;
		const allPost = {
			userId: userData.id,
			userName: userData.name,
			userDisplayName: userData.displayName,
			postRef: change.after!.ref,
			created: post.created,
			updated: post.updated,
			subject: post.subject,
			body: post.body,
		} as AllPost;
		const oldAllPosts = await firestore.collection("allPosts").where("postRef", "==", oldPostRef).get();
		let count = 0;
		const promises: Promise<FirebaseFirestore.WriteResult>[] = [];
		oldAllPosts.forEach((oldAllPost) => {
			if (++count > 1) {
				// error!
			}
			promises.push(firestore.collection("allPosts").doc(oldAllPost.id).set(
				allPost,
				{merge: true}
			));
		});
		if (count === 0) {
			// error!
		}
		const result = await Promise.all(promises);
		return result[0];
	} catch (error) {
		return Promise.reject(error);
	}
}


export const onUserPostCreate = functions.firestore.document("/users/{userName}/posts/{postId}").onCreate(copyToAllPost);
functions.firestore.document("/users/{userName}/posts/{postId}").onUpdate(updateToAllPost);

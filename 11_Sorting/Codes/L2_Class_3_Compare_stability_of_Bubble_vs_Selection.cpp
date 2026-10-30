#include <iostream>
#include <string>
using namespace std;

// each item has a key (used for sorting) and a tag (to see the original order)
void show(string name, int key[], char tag[], int n) {
    cout << name;
    for (int i = 0; i < n; i++) {
        cout << key[i] << tag[i] << " ";
    }
    cout << endl;
}

int main() {
    int n = 3;
    int k1[] = {4, 4, 1};
    char t1[] = {'a', 'b', 'c'};
    int k2[] = {4, 4, 1};
    char t2[] = {'a', 'b', 'c'};
    show("Input     : ", k1, t1, n);

    // bubble sort: only neighbours swap, and only if strictly bigger
    for (int i = 0; i < n - 1; i++) {
        for (int j = 0; j < n - 1 - i; j++) {
            if (k1[j] > k1[j + 1]) {
                swap(k1[j], k1[j + 1]);
                swap(t1[j], t1[j + 1]);
            }
        }
    }
    show("Bubble    : ", k1, t1, n);

    // selection sort: a long-distance swap can jump over an equal key
    for (int i = 0; i < n - 1; i++) {
        int minIdx = i;
        for (int j = i + 1; j < n; j++) {
            if (k2[j] < k2[minIdx]) {
                minIdx = j;
            }
        }
        swap(k2[i], k2[minIdx]);
        swap(t2[i], t2[minIdx]);
    }
    show("Selection : ", k2, t2, n);

    cout << "Bubble keeps 4a before 4b (stable)." << endl;
    cout << "Selection puts 4b before 4a (not stable)." << endl;
    return 0;
}
